using BookStore.Api.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Data
{
    public static class DbSeeder
    {
        public static void SeedBooksFromJson(AppDbContext context, string jsonPath)
        {
            // Only seed if there are no books in the database
            if (!context.Books.Any())
            {
                if (File.Exists(jsonPath))
                {
                    var json = File.ReadAllText(jsonPath);
                    var books = JsonSerializer.Deserialize<List<Book>>(json);

                    if (books != null)
                    {
                        context.Books.AddRange(books);
                        context.SaveChanges();
                        Console.WriteLine($"Seeded {books.Count} books from JSON.");
                    }
                }
            }
        }

        public static void SeedAdmin(AppDbContext context)
        {
            if (!context.Users.Any(u => u.Username == "admin"))
            {
                context.Users.Add(new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
                    Role = "Admin",
                    FirstName = "Sistem",
                    LastName = "Yöneticisi",
                    Email = "admin@bookstore.com"
                });
                context.SaveChanges();
            }
        }

        public static void SyncStockStatus(AppDbContext context)
        {
            var zeroStockBooks = context.Books.Where(b => b.StockQuantity <= 0 && b.IsActive).ToList();
            foreach (var book in zeroStockBooks)
            {
                book.IsActive = false;
            }
            context.SaveChanges();
        }
    }
}
