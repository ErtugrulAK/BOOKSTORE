namespace BookStore.Api.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        
        public int OrderId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Order? Order { get; set; }
        
        public int BookId { get; set; }
        public Book? Book { get; set; }
        
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
