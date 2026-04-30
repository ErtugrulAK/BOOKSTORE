using BookStore.Api.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace BookStore.Api.Data
{
    public static class DbSeeder
    {
        public static void SeedBooksFromJson(AppDbContext context, string jsonPath)
        {
            // 1. Clear existing books (and related data via cascade if possible, or manually)
            // Using raw SQL for efficiency and to handle cascade if needed
            context.Database.ExecuteSqlRaw("TRUNCATE TABLE \"OrderItems\" CASCADE;");
            context.Database.ExecuteSqlRaw("TRUNCATE TABLE \"Books\" CASCADE;");

            if (File.Exists(jsonPath))
            {
                var json = File.ReadAllText(jsonPath);
                var books = JsonSerializer.Deserialize<List<Book>>(json);

                if (books != null)
                {
                    context.Books.AddRange(books);
                    context.SaveChanges();
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
                    Role = "Admin"
                });

            }
            if (!context.Users.Any(u => u.Username == "user1"))
            {
                context.Users.Add(new User
                {
                    Username = "user1",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
                    Role = "User"
                });
            }
            context.SaveChanges();
        }
    }
}
