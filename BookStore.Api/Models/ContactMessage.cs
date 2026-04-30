using System;

namespace BookStore.Api.Models
{
    public class ContactMessage
    {
        public int Id { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsRead { get; set; } = false;
        public string? Reply { get; set; }
        public DateTime? RepliedAt { get; set; }
    }
}
