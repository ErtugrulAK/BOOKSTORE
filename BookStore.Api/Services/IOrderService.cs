using BookStore.Api.Models;

namespace BookStore.Api.Services
{
    public interface IOrderService
    {
        Task<Order> CreateFromBookAsync(int userId, int bookId, int quantity);

        
        Task<List<Order>> GetMineAsync(int userId);
        Task<(List<Order> Items, int TotalCount)> GetAllAsync(int page, int pageSize);

        
        Task<Order> MarkPaidAsync(int orderId);
        Task<Order> CancelAsync(int orderId, int userId, bool isAdmin);
        Task<Order> UpdateStatusAsync(int orderId, OrderStatus newStatus);
        Task<bool> VerifyPickupCodeAsync(int orderId, string code);
    }
}
