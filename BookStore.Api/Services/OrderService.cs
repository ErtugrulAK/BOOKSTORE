using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Services
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;

        public OrderService(AppDbContext context)
        {
            _context = context;
        }

        // ✅ NEW: BookId ile sipariş oluşturma (fiyat DB’den)
        public async Task<Order> CreateFromBookAsync(int userId, int bookId, int quantity)
        {
            if (quantity <= 0)
                throw new InvalidOperationException("Quantity must be > 0");

            var book = await _context.Books
                .FirstOrDefaultAsync(b => b.Id == bookId && b.IsActive);

            if (book == null)
                throw new KeyNotFoundException("Book not found");

            if (book.StockQuantity < quantity)
                throw new InvalidOperationException("Yetersiz stok!");

            // Stok düş
            book.StockQuantity -= quantity;
            if (book.StockQuantity <= 0) book.IsActive = false;

            var order = new Order
            {
                OrderNumber = "#ORD-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss"),
                UserId = userId,
                TotalPrice = book.Price * quantity,
                Status = OrderStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        BookId = book.Id,
                        Quantity = quantity,
                        UnitPrice = book.Price
                    }
                }
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        // ✅ User kendi siparişleri
        public async Task<List<Order>> GetMineAsync(int userId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Book)
                .Where(o => o.UserId == userId && o.Status != OrderStatus.Pending)
                .OrderByDescending(o => o.CreatedAtUtc)
                .ToListAsync();
        }

        // ✅ Admin tüm siparişler (Paginated)
        public async Task<(List<Order> Items, int TotalCount)> GetAllAsync(int page, int pageSize)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Book)
                .Where(o => o.Status != OrderStatus.Pending);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(o => o.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        // ✅ Admin durum günceller
        public async Task<Order> UpdateStatusAsync(int orderId, OrderStatus newStatus)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) throw new KeyNotFoundException("Order not found");

            var oldStatus = order.Status;
            order.Status = newStatus;

            // Eğer iptal edildiyse stokları geri yükle (Eskiden iptal değilse)
            if (newStatus == OrderStatus.Cancelled && oldStatus != OrderStatus.Cancelled)
            {
                foreach (var item in order.OrderItems)
                {
                    var book = await _context.Books.FindAsync(item.BookId);
                    if (book != null) 
                    {
                        book.StockQuantity += item.Quantity;
                        if (book.StockQuantity > 0) book.IsActive = true;
                    }
                }
            }
            // Eğer iptalden geri alındıysa stokları tekrar düş
            else if (oldStatus == OrderStatus.Cancelled && newStatus != OrderStatus.Cancelled)
            {
                foreach (var item in order.OrderItems)
                {
                    var book = await _context.Books.FindAsync(item.BookId);
                    if (book != null) 
                    {
                        book.StockQuantity -= item.Quantity;
                        if (book.StockQuantity <= 0) book.IsActive = false;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return order;
        }

        // ✅ Admin ödenmiş yapar
        public async Task<Order> MarkPaidAsync(int orderId)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) throw new KeyNotFoundException("Order not found");

            if (order.Status == OrderStatus.Cancelled)
                throw new InvalidOperationException("Cancelled order cannot be paid");

            order.Status = OrderStatus.Paid;
            await _context.SaveChangesAsync();
            return order;
        }

        // ✅ İptal (admin herkesinkini, user sadece kendininkini)
        public async Task<Order> CancelAsync(int orderId, int userId, bool isAdmin)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) throw new KeyNotFoundException("Order not found");

            if (!isAdmin && order.UserId != userId)
                throw new UnauthorizedAccessException("You can cancel only your own order");

            if (order.Status == OrderStatus.Paid && !isAdmin)
                throw new InvalidOperationException("Paid order cannot be cancelled");

            if (order.Status != OrderStatus.Cancelled)
            {
                order.Status = OrderStatus.Cancelled;
                // Stok iadesi
                foreach (var item in order.OrderItems)
                {
                    var book = await _context.Books.FindAsync(item.BookId);
                    if (book != null) 
                    {
                        book.StockQuantity += item.Quantity;
                        if (book.StockQuantity > 0) book.IsActive = true;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<bool> VerifyPickupCodeAsync(int orderId, string code)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null || string.IsNullOrEmpty(order.PickupCode)) return false;
            
            if (order.PickupCode.Equals(code, StringComparison.OrdinalIgnoreCase))
            {
                // Removed automatic status change to let admin handle it manually
                return true;
            }
            return false;
        }
    }
}
