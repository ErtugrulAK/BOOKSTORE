using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CartController(AppDbContext db)
        {
            _db = db;
        }

        private int CurrentUserId() => int.Parse(User.FindFirstValue("uid")!);

        private async Task<Order?> GetCartAsync(bool createIfNull = false)
        {
            var userId = CurrentUserId();
            var cart = await _db.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .FirstOrDefaultAsync(o => o.UserId == userId && o.Status == OrderStatus.Pending);

            if (cart == null && createIfNull)
            {
                cart = new Order
                {
                    UserId = userId,
                    OrderNumber = "#CRT-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss"),
                    Status = OrderStatus.Pending,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _db.Orders.Add(cart);
                await _db.SaveChangesAsync();
            }

            return cart;
        }

        private void RecalculateTotal(Order cart)
        {
            cart.TotalPrice = cart.OrderItems.Sum(oi => oi.UnitPrice * oi.Quantity);
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            // createIfNull = false because we just want to look at it, not create an empty one
            var cart = await GetCartAsync(false);
            
            // If the user has no cart, return an empty shell to the frontend instead of saving a ghost cart.
            if (cart == null)
            {
                return Ok(new Order { OrderItems = new List<OrderItem>() });
            }

            return Ok(cart);
        }

        public record AddToCartRequest(int BookId, int Quantity);

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddToCartRequest req)
        {
            if (req.Quantity <= 0) return BadRequest("Miktar sıfırdan büyük olmalıdır.");

            var book = await _db.Books.FindAsync(req.BookId);
            if (book == null || !book.IsActive) return NotFound("Kitap bulunamadı veya satışa kapalı.");

            // Sepete EKLENİRKEN yeni sepet oluşturulabilir (true)
            var cart = await GetCartAsync(true);

            var existingItem = cart.OrderItems.FirstOrDefault(oi => oi.BookId == req.BookId);
            if (existingItem != null)
            {
                existingItem.Quantity += req.Quantity;
                existingItem.UnitPrice = book.Price; // Update to latest price
            }
            else
            {
                var newItem = new OrderItem
                {
                    OrderId = cart.Id,
                    BookId = book.Id,
                    Quantity = req.Quantity,
                    UnitPrice = book.Price
                };
                cart.OrderItems.Add(newItem);
                _db.OrderItems.Add(newItem);
            }

            RecalculateTotal(cart);
            await _db.SaveChangesAsync();

            return Ok(cart);
        }

        [HttpPut("items/{bookId}")]
        public async Task<IActionResult> UpdateItemQuantity(int bookId, [FromBody] int quantity)
        {
            var cart = await GetCartAsync(false);
            if (cart == null) return NotFound("Sepet bulunamadı.");
            
            var item = cart.OrderItems.FirstOrDefault(oi => oi.BookId == bookId);

            if (item == null) return NotFound("Ürün sepette değil.");

            if (quantity <= 0)
            {
                cart.OrderItems.Remove(item);
            }
            else
            {
                item.Quantity = quantity;
            }

            RecalculateTotal(cart);
            await _db.SaveChangesAsync();

            return Ok(cart);
        }

        [HttpDelete("items/{bookId}")]
        public async Task<IActionResult> RemoveItem(int bookId)
        {
            var cart = await GetCartAsync(false);
            if (cart == null) return Ok(new Order { OrderItems = new List<OrderItem>() });
            
            var item = cart.OrderItems.FirstOrDefault(oi => oi.BookId == bookId);

            if (item != null)
            {
                cart.OrderItems.Remove(item);
                RecalculateTotal(cart);
                await _db.SaveChangesAsync();
            }

            return Ok(cart);
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var cart = await GetCartAsync(false);
            if (cart != null)
            {
                _db.OrderItems.RemoveRange(cart.OrderItems);
                _db.Orders.Remove(cart);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Sepet boşaltıldı." });
        }

        public record CheckoutRequest(string DeliveryAddress);

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
        {
            var cart = await GetCartAsync(false);
            if (cart == null || !cart.OrderItems.Any())
                return BadRequest("Sepetiniz boş.");

            // Normally interact with payment gateway here (Iyzico etc.)

            cart.DeliveryAddress = req.DeliveryAddress;
            
            if (req.DeliveryAddress != null && req.DeliveryAddress.Contains("Dekanlıktan Gelip Alma"))
            {
                // Generate a unique 6-digit alphanumeric pickup code
                cart.PickupCode = "DK-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            }
            // ShippingFee and TotalPrice are already calculated properly by the backend

            cart.Status = OrderStatus.Processing; // Default status is now 'Hazırlanıyor' (2)
            cart.OrderNumber = cart.OrderNumber.Replace("CRT", "ORD"); // Change prefix to Order

            // Check and decrease stock
            foreach (var item in cart.OrderItems)
            {
                var book = await _db.Books.FindAsync(item.BookId);
                if (book != null)
                {
                    if (book.StockQuantity < item.Quantity)
                        return BadRequest($"'{book.Name}' stokta yeterli değil. Sadece {book.StockQuantity} adet var.");

                    book.StockQuantity -= item.Quantity;
                    if (book.StockQuantity <= 0) book.IsActive = false;
                }
                else
                {
                    return BadRequest("Sepetinizdeki bazı ürünler sistemden kaldırılmış.");
                }
            }

            await _db.SaveChangesAsync();
            return Ok(cart);
        }

        [HttpGet("validate")]
        public async Task<IActionResult> ValidateStock()
        {
            var cart = await GetCartAsync(false);
            if (cart == null || !cart.OrderItems.Any())
                return Ok(new { isValid = true });

            foreach (var item in cart.OrderItems)
            {
                var book = await _db.Books.FindAsync(item.BookId);
                if (book == null || book.StockQuantity < item.Quantity)
                {
                    return Ok(new { 
                        isValid = false, 
                        message = book == null 
                            ? "Sepetinizdeki bazı ürünler artık satışta değil. Lütfen sepetinizi kontrol edin." 
                            : $"Maalesef '{book.Name}' için talep ettiğiniz miktarda stok bulunmuyor (Mevcut stok: {book.StockQuantity} adet). Lütfen sepetinizi gözden geçiriniz." 
                    });
                }
            }

            return Ok(new { isValid = true });
        }
    }
}
