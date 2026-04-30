namespace BookStore.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        [System.Text.Json.Serialization.JsonIgnore]
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = "Admin"; 
        
        // Profile Info
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        
        
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
