using System.ComponentModel.DataAnnotations;

namespace BookStore.Api.Models
{
    public class UserAddress
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string Title { get; set; } = null!; // e.g. Home, Office

        [Required]
        [MaxLength(100)]
        public string ReceiverName { get; set; } = null!; // Who will receive the package

        [Required]
        [MaxLength(500)]
        public string AddressDetails { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = null!;

        public bool IsDefault { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
