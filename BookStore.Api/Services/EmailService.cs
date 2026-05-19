using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using BookStore.Api.Models;

namespace BookStore.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendCustomEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                // Eğer şifre "xxxx" veya girilmemişse, SMTP işlemi iptal edilir, sadece console'a log atar.
                // (Geliştirme / Test amaçlı kullanım)
                if (string.IsNullOrEmpty(_emailSettings.Password) || _emailSettings.Password.Contains("xxxx"))
                {
                    _logger.LogWarning($"[MOCK EMAIL] To: {toEmail} | Subject: {subject} | Body: {body}");
                    return;
                }

                using var client = new SmtpClient(_emailSettings.Host, _emailSettings.Port)
                {
                    Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                    EnableSsl = _emailSettings.EnableSSL
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_emailSettings.Username, "DEÜ Kitap Satış"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email sent successfully to {toEmail} regarding {subject}");
            }
            catch (Exception ex)
            {
                // Hata tüm sistemi çökertmemesi için yakalanır (Rehberdeki mantık)
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
            }
        }

        public async Task SendOrderShippedEmailAsync(string toEmail, string orderNumber)
        {
            string subject = $"Siparişiniz Kargoya Verildi! ({orderNumber})";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px;'>
                    <h2 style='color: #2563eb;'>Harika Haber!</h2>
                    <p>Merhaba,</p>
                    <p><strong>{orderNumber}</strong> numaralı siparişiniz başarıyla kargoya teslim edilmiştir.</p>
                    <p>Bizi tercih ettiğiniz için teşekkür ederiz. Siparişinizin durumunu web sitemiz üzerinden takip edebilirsiniz.</p>
                    <hr style='border: 1px solid #eee; margin: 20px 0;'/>
                    <p style='font-size: 12px; color: #888;'>DEÜ Kitap Satış Platformu</p>
                </div>";

            await SendCustomEmailAsync(toEmail, subject, body);
        }

        public async Task SendOrderCreatedEmailAsync(string toEmail, string orderNumber)
        {
            string subject = $"Siparişiniz Alınmıştır! ({orderNumber})";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px;'>
                    <h2 style='color: #16a34a;'>Siparişiniz Alındı!</h2>
                    <p>Merhaba,</p>
                    <p><strong>{orderNumber}</strong> numaralı siparişiniz başarıyla oluşturulmuştur.</p>
                    <p>Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
                    <hr style='border: 1px solid #eee; margin: 20px 0;'/>
                    <p style='font-size: 12px; color: #888;'>DEÜ Kitap Satış Platformu</p>
                </div>";

            await SendCustomEmailAsync(toEmail, subject, body);
        }

        public async Task SendOrderStatusChangedEmailAsync(string toEmail, string orderNumber, OrderStatus oldStatus, OrderStatus newStatus)
        {
            string newStatusText = newStatus switch
            {
                OrderStatus.Pending => "Beklemede",
                OrderStatus.Paid => "Ödendi",
                OrderStatus.Processing => "Hazırlanıyor",
                OrderStatus.Shipped => "Kargoya Verildi",
                OrderStatus.Delivered => "Teslim Edildi",
                OrderStatus.Cancelled => "İptal Edildi",
                OrderStatus.HandDelivered => "Elden Teslim Edildi",
                OrderStatus.Returned => "İade Edildi",
                _ => "Bilinmiyor"
            };

            string title = newStatus switch
            {
                OrderStatus.Processing => "Siparişiniz Hazırlanıyor!",
                OrderStatus.Shipped => "Siparişiniz Kargoya Verildi!",
                OrderStatus.Cancelled => "Siparişiniz İptal Edildi",
                OrderStatus.HandDelivered => "Siparişiniz Elden Teslim Edildi!",
                OrderStatus.Paid => "Ödemeniz Onaylandı!",
                OrderStatus.Returned => "Siparişiniz İade Edildi",
                _ => "Siparişinizin Durumu Güncellendi!"
            };

            string color = newStatus switch
            {
                OrderStatus.Processing => "#3b82f6", // Blue
                OrderStatus.Shipped => "#2563eb", // Darker Blue
                OrderStatus.Cancelled => "#dc2626", // Red
                OrderStatus.HandDelivered => "#16a34a", // Green
                OrderStatus.Paid => "#16a34a", // Green
                OrderStatus.Returned => "#ef4444", // Red/Orange for Return
                _ => "#4b5563" // Gray
            };

            string subject = $"Siparişinizin Durumu Güncellendi: {newStatusText} ({orderNumber})";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px;'>
                    <h2 style='color: {color};'>{title}</h2>
                    <p>Merhaba,</p>
                    <p><strong>{orderNumber}</strong> numaralı siparişinizin durumu <strong>{newStatusText}</strong> olarak güncellenmiştir.</p>
                    <p>Siparişinizin detaylarını web sitemiz üzerinden her zaman kontrol edebilirsiniz.</p>
                    <hr style='border: 1px solid #eee; margin: 20px 0;'/>
                    <p style='font-size: 12px; color: #888;'>DEÜ Kitap Satış Platformu</p>
                </div>";

            await SendCustomEmailAsync(toEmail, subject, body);
        }
    }
}
