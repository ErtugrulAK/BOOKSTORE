using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStore.Api.Data;
using BookStore.Api.Models;
using BookStore.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace BookStore.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public ContactController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ContactMessage>> PostMessage(ContactMessage message)
        {
            message.CreatedAt = DateTime.UtcNow;
            message.IsRead = false;
            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync();
            return Ok(message);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMessages([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] bool? isRead = null)
        {
            var query = _context.ContactMessages.AsNoTracking();
            if (isRead.HasValue) query = query.Where(m => m.IsRead == isRead.Value);
            var totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(m => m.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return Ok(new { Items = items, TotalCount = totalCount });
        }

        [HttpPut("reply/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReplyMessage(int id, [FromBody] string reply)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null) return NotFound();

            message.Reply = reply;
            message.RepliedAt = DateTime.UtcNow;
            message.IsRead = true;
            await _context.SaveChangesAsync();

            try
            {
                string subject = "Mesajınıza Yanıt: " + message.Subject;
                string body = $@"
                    <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
                        <div style=""background: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;"">
                            <h2 style=""color: white; margin: 0;"">📚 DEÜ Kitap Satış</h2>
                            <p style=""color: #bfdbfe; margin: 4px 0 0;"">Mesajınıza Yanıt</p>
                        </div>
                        <div style=""background: white; padding: 28px; border: 1px solid #e2e8f0; border-top: none;"">
                            <p style=""color: #475569; font-size: 15px;"">Merhaba <strong>{message.SenderName}</strong>,</p>
                            <p style=""color: #475569;""><strong>""{message.Subject}""</strong> konulu mesajınıza yanıt verildi:</p>
                            <div style=""background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;"">
                                <p style=""color: #1e293b; margin: 0; line-height: 1.7;"">{reply}</p>
                            </div>
                            <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;""/>
                            <p style=""color: #94a3b8; font-size: 12px; margin: 0;"">Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu adrese yanıt vermeyiniz.</p>
                        </div>
                        <div style=""background: #f8fafc; padding: 12px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e2e8f0; border-top: none;"">
                            <p style=""color: #94a3b8; font-size: 12px; margin: 0;"">© DEÜ Mühendislik Fakültesi Kitap Satış Sistemi</p>
                        </div>
                    </div>";

                await _emailService.SendCustomEmailAsync(message.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ContactController] Email Error: " + ex.Message);
            }

            return NoContent();
        }

        [HttpPut("read/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null) return NotFound();
            message.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
