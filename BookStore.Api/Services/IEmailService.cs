namespace BookStore.Api.Services
{
    public interface IEmailService
    {
        Task SendOrderShippedEmailAsync(string toEmail, string orderNumber);
        Task SendCustomEmailAsync(string toEmail, string subject, string body);
    }
}
