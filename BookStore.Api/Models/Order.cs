namespace BookStore.Api.Models
{
    public enum OrderStatus
    {
        Pending = 0,      // Beklemede
        Paid = 1,         // Ödendi (Sistem İçi)
        Processing = 2,   // Hazırlanıyor
        Shipped = 3,      // Kargolandı
        Delivered = 4,    // Teslim Edildi
        Cancelled = 5     // İptal Edildi
    }

    public class Order
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = null!; // e.g. #ORD-2023-891
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public decimal TotalPrice { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        // Delivery Info (Snapshot of user address at order time)
        public string? DeliveryAddress { get; set; }
        public string? PickupCode { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
