using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using BookStore.Api.Data;
using BookStore.Api.Models;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext db, IConfiguration config, IMemoryCache cache, IEmailService emailService)
        {
            _db = db;
            _config = config;
            _cache = cache;
            _emailService = emailService;
        }

        public record LoginRequest(string Username, string Password);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username || u.Email == req.Username);
            if (user == null) return Unauthorized("Invalid credentials");

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized("Invalid credentials");

            var claims = new[]
            {
                new Claim("uid", user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(6),
                signingCredentials: creds
            );

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = new { user.Id, user.FirstName, user.LastName, user.Email, user.Role, user.PhoneNumber } });
        }

        public record RegisterRequest(string FirstName, string LastName, string Email, string Password);
        
        public class CachedRegistration
        {
            public RegisterRequest Request { get; set; } = null!;
            public string Code { get; set; } = null!;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email || u.Username == req.Email))
                return BadRequest(new { message = "Bu e-posta adresi zaten kullanımda." });

            // Generate 6-digit code
            var random = new Random();
            string code = random.Next(100000, 999999).ToString();

            // Store in cache for 10 minutes
            var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
            _cache.Set($"Registration_{req.Email}", new CachedRegistration { Request = req, Code = code }, cacheOptions);

            // Send verification email
            string subject = "DEÜ Kitap Satış - E-Posta Doğrulama Kodu";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>
                    <h2 style='color: #2563eb;'>E-Posta Doğrulama</h2>
                    <p>Merhaba {req.FirstName},</p>
                    <p>Kayıt işlemini tamamlamak için aşağıdaki 6 haneli kodu kullanın:</p>
                    <h1 style='letter-spacing: 5px; color: #1e40af; background: #f3f4f6; padding: 10px; border-radius: 8px; display: inline-block;'>{code}</h1>
                    <p style='color: #ef4444; font-size: 12px;'>Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
                </div>";

            await _emailService.SendCustomEmailAsync(req.Email, subject, body);

            return Ok(new { requireVerification = true, message = "E-posta adresinize 6 haneli doğrulama kodu gönderildi." });
        }

        public record VerifyEmailRequest(string Email, string Code);

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest req)
        {
            if (!_cache.TryGetValue($"Registration_{req.Email}", out CachedRegistration? cachedData) || cachedData == null)
            {
                return BadRequest(new { message = "Doğrulama süresi dolmuş veya geçersiz e-posta." });
            }

            if (cachedData.Code != req.Code)
            {
                return BadRequest(new { message = "Hatalı doğrulama kodu!" });
            }

            // Doğrulama başarılı, kullanıcıyı kaydet
            var user = new User
            {
                Username = cachedData.Request.Email, 
                Email = cachedData.Request.Email,
                FirstName = cachedData.Request.FirstName,
                LastName = cachedData.Request.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(cachedData.Request.Password),
                Role = "User"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Cache'den sil
            _cache.Remove($"Registration_{req.Email}");

            return Ok(new { message = "Kayıt başarıyla tamamlandı! Artık giriş yapabilirsiniz." });
        }
    }
}
