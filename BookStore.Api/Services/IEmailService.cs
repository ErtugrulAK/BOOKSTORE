using BookStore.Api.Models;

namespace BookStore.Api.Services
{
    public interface IEmailService
    {
        Task SendOrderShippedEmailAsync(string toEmail, string orderNumber);
        Task SendOrderCreatedEmailAsync(string toEmail, string orderNumber);
        Task SendCustomEmailAsync(string toEmail, string subject, string body);
        Task SendOrderStatusChangedEmailAsync(string toEmail, string orderNumber, OrderStatus oldStatus, OrderStatus newStatus);
    }
}
