namespace BookStore.Api.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Author { get; set; }
        public string? Publisher { get; set; }
        public string? ISBN { get; set; }
        public string? Language { get; set; }
        public string? Edition { get; set; }
        public string? ImageUrl { get; set; }
        public int? PublicationYear { get; set; }
        public int? PageCount { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; } = 25;
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; } = true;

        public string? Category { get; set; }

        public string? PaymentInfo { get; set; }
        public string? StoreInfo { get; set; }
    }
}
