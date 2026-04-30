using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BooksController(AppDbContext db)
        {
            _db = db;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? category, 
            [FromQuery] string? search, 
            [FromQuery] decimal? minPrice, 
            [FromQuery] decimal? maxPrice, 
            [FromQuery] bool? isCritical = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _db.Books
                .AsNoTracking();

            if (isActive.HasValue)
            {
                query = query.Where(b => b.IsActive == isActive.Value);
            }
            else if (!includeInactive)
            {
                query = query.Where(b => b.IsActive);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(b => b.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(b => b.Name.ToLower().Contains(lowerSearch) || (b.Author != null && b.Author.ToLower().Contains(lowerSearch)));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(b => b.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(b => b.Price <= maxPrice.Value);
            }

            if (isCritical == true)
            {
                query = query.Where(b => b.StockQuantity > 0 && b.StockQuantity <= b.MinStockLevel);
            }

            var totalCount = await query.CountAsync();
            var books = await query
                .OrderByDescending(b => b.IsActive)
                .ThenBy(b => b.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { Items = books, TotalCount = totalCount });
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var book = await _db.Books
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id && b.IsActive);

            if (book == null) return NotFound();
            return Ok(book);
        }

        public record BookRequest(
            string Name, string? Author, string? Publisher, string? ISBN,
            string? Language, string? Edition, string? ImageUrl, int? PublicationYear, int? PageCount,
            string? Description, decimal Price, int StockQuantity,
            int MinStockLevel, bool IsFeatured, bool IsActive, string? Category
        );

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name required");
            if (req.Price < 0) return BadRequest("Price cannot be negative");

            var book = new Book
            {
                Name = req.Name,
                Author = req.Author,
                Publisher = req.Publisher,
                ISBN = req.ISBN,
                Language = req.Language,
                Edition = req.Edition,
                ImageUrl = req.ImageUrl,
                PublicationYear = req.PublicationYear,
                PageCount = req.PageCount,
                Description = req.Description,
                Price = req.Price,
                StockQuantity = req.StockQuantity,
                MinStockLevel = req.MinStockLevel,
                IsFeatured = req.IsFeatured,
                IsActive = req.IsActive,
                Category = req.Category
            };

            if (book.StockQuantity <= 0)
            {
                book.IsActive = false;
            }

            _db.Books.Add(book);
            await _db.SaveChangesAsync();
            
            return Ok(book);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BookRequest req)
        {
            var existing = await _db.Books.FindAsync(id);
            if (existing == null) return NotFound();

            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name required");
            if (req.Price < 0) return BadRequest("Price cannot be negative");

            existing.Name = req.Name;
            existing.Author = req.Author;
            existing.Publisher = req.Publisher;
            existing.ISBN = req.ISBN;
            existing.Language = req.Language;
            existing.Edition = req.Edition;
            existing.ImageUrl = req.ImageUrl;
            existing.PublicationYear = req.PublicationYear;
            existing.PageCount = req.PageCount;
            existing.Description = req.Description;
            existing.Price = req.Price;
            existing.StockQuantity = req.StockQuantity;
            existing.MinStockLevel = req.MinStockLevel;
            existing.IsFeatured = req.IsFeatured;
            existing.Category = req.Category;

            // Otomatik aktif/pasif kontrolü
            if (existing.StockQuantity <= 0) 
            {
                existing.IsActive = false;
            }
            else 
            {
                existing.IsActive = req.IsActive;
            }

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var book = await _db.Books.FindAsync(id);
            if (book == null) return NotFound();

            book.IsActive = false; // Soft delete
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("bulk-status")]
        public async Task<IActionResult> BulkStatusUpdate([FromQuery] bool active)
        {
            var books = await _db.Books.ToListAsync();
            foreach (var book in books)
            {
                book.IsActive = active;
            }
            await _db.SaveChangesAsync();
            return Ok(new { message = $"Tüm kitaplar {(active ? "yayına alındı" : "yayından kaldırıldı")}." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("bulk-price")]
        public async Task<IActionResult> BulkPriceUpdate([FromQuery] decimal percentage)
        {
            var books = await _db.Books.ToListAsync();
            foreach (var book in books)
            {
                book.Price += (book.Price * (percentage / 100));
            }
            await _db.SaveChangesAsync();
            return Ok(new { message = "Fiyatlar güncellendi." });
        }
    }
}
