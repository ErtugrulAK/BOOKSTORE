using BookStore.Api.Data;
using BookStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DashboardController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var now = DateTime.UtcNow;
            var thisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var lastMonth = thisMonth.AddMonths(-1);

            var thisMonthUsers = await _db.Users.CountAsync(u => u.CreatedAt >= thisMonth);
            var lastMonthUsers = await _db.Users.CountAsync(u => u.CreatedAt >= lastMonth && u.CreatedAt < thisMonth);

            var totalBooks = await _db.Books.CountAsync();
            var totalOrders = await _db.Orders.CountAsync();
            var cancelledOrders = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Cancelled);
            
            var totalSoldBooks = await _db.OrderItems
                .Where(oi => oi.Order!.Status == OrderStatus.Shipped || oi.Order!.Status == OrderStatus.Delivered)
                .SumAsync(oi => (int?)oi.Quantity) ?? 0;

            var totalRevenue = await _db.Orders
                .Where(o => o.Status == OrderStatus.Shipped || o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.TotalPrice) ?? 0;
            
            // This month revenue
            var thisMonthRevenue = await _db.Orders
                .Where(o => (o.Status == OrderStatus.Shipped || o.Status == OrderStatus.Delivered) && o.CreatedAtUtc >= thisMonth)
                .SumAsync(o => (decimal?)o.TotalPrice) ?? 0;
            
            // Last month revenue
            var lastMonthRevenue = await _db.Orders
                .Where(o => (o.Status == OrderStatus.Shipped || o.Status == OrderStatus.Delivered) && o.CreatedAtUtc >= lastMonth && o.CreatedAtUtc < thisMonth)
                .SumAsync(o => (decimal?)o.TotalPrice) ?? 0;

            // This month orders
            var thisMonthOrders = await _db.Orders.CountAsync(o => o.CreatedAtUtc >= thisMonth);
            var lastMonthOrders = await _db.Orders.CountAsync(o => o.CreatedAtUtc >= lastMonth && o.CreatedAtUtc < thisMonth);

            // This month sold books
            var thisMonthSoldBooks = await _db.OrderItems
                .Where(oi => (oi.Order!.Status == OrderStatus.Shipped || oi.Order!.Status == OrderStatus.Delivered) && oi.Order!.CreatedAtUtc >= thisMonth)
                .SumAsync(oi => (int?)oi.Quantity) ?? 0;
            var lastMonthSoldBooks = await _db.OrderItems
                .Where(oi => (oi.Order!.Status == OrderStatus.Shipped || oi.Order!.Status == OrderStatus.Delivered) && oi.Order!.CreatedAtUtc >= lastMonth && oi.Order!.CreatedAtUtc < thisMonth)
                .SumAsync(oi => (int?)oi.Quantity) ?? 0;

            return Ok(new
            {
                ThisMonthUsers = thisMonthUsers,
                LastMonthUsers = lastMonthUsers,
                TotalBooks = totalBooks,
                TotalOrders = totalOrders,
                CancelledOrdersCount = cancelledOrders,
                TotalRevenue = totalRevenue,
                TotalSoldBooks = totalSoldBooks,
                
                ThisMonthRevenue = thisMonthRevenue,
                LastMonthRevenue = lastMonthRevenue,
                ThisMonthOrders = thisMonthOrders,
                LastMonthOrders = lastMonthOrders,
                ThisMonthSoldBooks = thisMonthSoldBooks,
                LastMonthSoldBooks = lastMonthSoldBooks
            });
        }
    }
}
