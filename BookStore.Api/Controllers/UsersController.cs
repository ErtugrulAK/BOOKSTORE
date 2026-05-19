using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using BookStore.Api.Services;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public UsersController(AppDbContext db, IMemoryCache cache, IEmailService emailService)
        {
            _db = db;
            _cache = cache;
            _emailService = emailService;
        }

        // Admin: Get All Users
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? role, 
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _db.Users.AsNoTracking();

            if (!string.IsNullOrEmpty(role))
                query = query.Where(u => u.Role == role);

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(u => 
                    u.Email!.ToLower().Contains(lowerSearch) || 
                    (u.FirstName + " " + u.LastName).ToLower().Contains(lowerSearch));
            }

            var totalCount = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { Items = users, TotalCount = totalCount });
        }

        // Admin: Get User details with Orders
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound();

            var orders = await _db.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .Where(o => o.UserId == id)
                .OrderByDescending(o => o.CreatedAtUtc)
                .AsNoTracking()
                .ToListAsync();

            return Ok(new { User = user, Orders = orders });
        }

        // Admin: Update User
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] User updateReq)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FirstName = updateReq.FirstName;
            user.LastName = updateReq.LastName;
            user.Email = updateReq.Email;
            user.PhoneNumber = updateReq.PhoneNumber;
            user.Role = updateReq.Role;

            await _db.SaveChangesAsync();
            return Ok(user);
        }

        // User/Admin: Get Own Profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirstValue("uid")!);
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();
            return Ok(user);
        }

        public record UpdateProfileRequest(string? FirstName, string? LastName, string? Email, string? PhoneNumber);

        // User: Update Own Profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
        {
            var userId = int.Parse(User.FindFirstValue("uid")!);
            var user = await _db.Users.FindAsync(userId);

            if (user == null) return NotFound();

            user.FirstName = req.FirstName ?? user.FirstName;
            user.LastName = req.LastName ?? user.LastName;
            user.Email = req.Email ?? user.Email;
            user.PhoneNumber = req.PhoneNumber ?? user.PhoneNumber;

            await _db.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPost("profile/password/send-code")]
        public async Task<IActionResult> SendPasswordChangeCode()
        {
            var userId = int.Parse(User.FindFirstValue("uid")!);
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Generate 6-digit code
            var random = new Random();
            string code = random.Next(100000, 999999).ToString();

            // Cache code for 10 minutes
            var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
            _cache.Set($"PasswordChange_{userId}", code, cacheOptions);

            // Send email
            string subject = "DEÜ Kitap Satış - Şifre Değişikliği Doğrulama Kodu";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>
                    <h2 style='color: #dc2626;'>Şifre Değişikliği Doğrulama</h2>
                    <p>Merhaba {user.FirstName},</p>
                    <p>Şifrenizi değiştirmek için aşağıdaki 6 haneli doğrulama kodunu kullanın:</p>
                    <h1 style='letter-spacing: 5px; color: #b91c1c; background: #fff5f5; padding: 10px; border-radius: 8px; display: inline-block; border: 1px solid #fecaca;'>{code}</h1>
                    <p style='color: #ef4444; font-size: 12px;'>Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
                </div>";

            await _emailService.SendCustomEmailAsync(user.Email!, subject, body);

            return Ok(new { message = "Doğrulama kodu e-posta adresinize gönderildi." });
        }

        public record ChangePasswordRequest(string CurrentPassword, string NewPassword, string? Code);

        [HttpPut("profile/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            var userId = int.Parse(User.FindFirstValue("uid")!);
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (string.IsNullOrEmpty(req.Code))
            {
                return BadRequest("Doğrulama kodu gereklidir.");
            }

            if (!_cache.TryGetValue($"PasswordChange_{userId}", out string? cachedCode) || cachedCode != req.Code)
            {
                return BadRequest("Hatalı veya süresi geçmiş doğrulama kodu.");
            }

            _cache.Remove($"PasswordChange_{userId}");

            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
                return BadRequest("Mevcut şifre hatalı.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Şifre başarıyla güncellendi." });
        }

        // Admin: Delete User
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirstValue("uid")!);
            if (userId == id) return BadRequest("Kendi hesabınızı silemezsiniz.");

            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            // İlgili siparişleri de kontrol etmek gerekebilir ama genellikle silmek yerine IsActive=false yapılır.
            // Ancak kullanıcı "sil" dediği için tamamen kaldırıyoruz. CASCADE açıksa siparişler de silinir.
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
