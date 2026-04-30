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
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AddressesController(AppDbContext db)
        {
            _db = db;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue("uid")!);

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var addresses = await _db.UserAddresses
                .Where(a => a.UserId == CurrentUserId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
            return Ok(addresses);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserAddress address)
        {
            address.UserId = CurrentUserId;
            address.CreatedAt = DateTime.UtcNow;

            // If this is the first address, make it default
            if (!await _db.UserAddresses.AnyAsync(a => a.UserId == CurrentUserId))
            {
                address.IsDefault = true;
            }
            else if (address.IsDefault)
            {
                // If new address is marked as default, unmark others
                var defaults = await _db.UserAddresses.Where(a => a.UserId == CurrentUserId && a.IsDefault).ToListAsync();
                foreach (var d in defaults) d.IsDefault = false;
            }

            _db.UserAddresses.Add(address);
            await _db.SaveChangesAsync();
            return Ok(address);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserAddress req)
        {
            var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId);
            if (address == null) return NotFound();

            address.Title = req.Title;
            address.ReceiverName = req.ReceiverName;
            address.AddressDetails = req.AddressDetails;
            address.PhoneNumber = req.PhoneNumber;
            
            if (req.IsDefault && !address.IsDefault)
            {
                var defaults = await _db.UserAddresses.Where(a => a.UserId == CurrentUserId && a.IsDefault).ToListAsync();
                foreach (var d in defaults) d.IsDefault = false;
                address.IsDefault = true;
            }

            await _db.SaveChangesAsync();
            return Ok(address);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId);
            if (address == null) return NotFound();

            _db.UserAddresses.Remove(address);
            await _db.SaveChangesAsync();

            // If we deleted the default address, make the next one default
            if (address.IsDefault)
            {
                var next = await _db.UserAddresses.Where(a => a.UserId == CurrentUserId).FirstOrDefaultAsync();
                if (next != null)
                {
                    next.IsDefault = true;
                    await _db.SaveChangesAsync();
                }
            }

            return Ok();
        }

        [HttpPut("{id}/default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId);
            if (address == null) return NotFound();

            var defaults = await _db.UserAddresses.Where(a => a.UserId == CurrentUserId && a.IsDefault).ToListAsync();
            foreach (var d in defaults) d.IsDefault = false;

            address.IsDefault = true;
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
