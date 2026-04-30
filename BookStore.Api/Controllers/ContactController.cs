using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace BookStore.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Contact
        [HttpPost]
        public async Task<ActionResult<ContactMessage>> PostMessage(ContactMessage message)
        {
            message.CreatedAt = DateTime.Now;
            message.IsRead = false;
            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync();
            return Ok(message);
        }

        // GET: api/Contact (Admin Only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMessages([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.ContactMessages.AsNoTracking();
            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { Items = items, TotalCount = totalCount });
        }

        // PUT: api/Contact/reply/5 (Admin Only)
        [HttpPut("reply/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReplyMessage(int id, [FromBody] string reply)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null) return NotFound();

            message.Reply = reply;
            message.RepliedAt = DateTime.Now;
            message.IsRead = true;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/Contact/read/5 (Admin Only)
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
