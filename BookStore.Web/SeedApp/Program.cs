using System;
using Npgsql;

var connString = "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=kitapsatisdb";
var passwordHash = BCrypt.Net.BCrypt.HashPassword("123");

using (var conn = new NpgsqlConnection(connString))
{
    conn.Open();
    Console.WriteLine("Veritabanına bağlanıldı.");

    // Kitapları Ekle (40 Aktif + 10 Pasif = 50)
    for (int i = 1; i <= 40; i++)
    {
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Books"" 
            (""Name"", ""Author"", ""Price"", ""StockQuantity"", ""MinStockLevel"", ""IsActive"", ""Category"", ""Description"") 
            VALUES (@name, @author, @price, @stock, @minStock, @active, @category, @desc)", conn);
        cmd.Parameters.AddWithValue("name", $"Kitap {i}");
        cmd.Parameters.AddWithValue("author", $"Yazar {i}");
        cmd.Parameters.AddWithValue("price", 50.0m + i);
        cmd.Parameters.AddWithValue("stock", 100);
        cmd.Parameters.AddWithValue("minStock", 10);
        cmd.Parameters.AddWithValue("active", true);
        cmd.Parameters.AddWithValue("category", "Roman");
        cmd.Parameters.AddWithValue("desc", $"{i}. aktif kitabın açıklaması.");
        cmd.ExecuteNonQuery();
    }

    for (int i = 1; i <= 10; i++)
    {
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Books"" 
            (""Name"", ""Author"", ""Price"", ""StockQuantity"", ""MinStockLevel"", ""IsActive"", ""Category"", ""Description"") 
            VALUES (@name, @author, @price, @stock, @minStock, @active, @category, @desc)", conn);
        cmd.Parameters.AddWithValue("name", $"Pasif Kitap {i}");
        cmd.Parameters.AddWithValue("author", $"Yazar {i}");
        cmd.Parameters.AddWithValue("price", 40.0m + i);
        cmd.Parameters.AddWithValue("stock", 50);
        cmd.Parameters.AddWithValue("minStock", 5);
        cmd.Parameters.AddWithValue("active", false);
        cmd.Parameters.AddWithValue("category", "Akademik");
        cmd.Parameters.AddWithValue("desc", $"{i}. pasif kitabın açıklaması.");
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine("50 kitap eklendi.");

    // Kullanıcıları Ekle (25 Tane)
    for (int i = 1; i <= 25; i++)
    {
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Users"" 
            (""Username"", ""PasswordHash"", ""Role"", ""FirstName"", ""LastName"", ""Email"", ""IsActive"", ""CreatedAt"") 
            VALUES (@user, @hash, @role, @f, @l, @email, @active, @date)", conn);
        cmd.Parameters.AddWithValue("user", $"user{i}");
        cmd.Parameters.AddWithValue("hash", passwordHash);
        cmd.Parameters.AddWithValue("role", "User");
        cmd.Parameters.AddWithValue("f", "User");
        cmd.Parameters.AddWithValue("l", i.ToString());
        cmd.Parameters.AddWithValue("email", $"user{i}@example.com");
        cmd.Parameters.AddWithValue("active", true);
        cmd.Parameters.AddWithValue("date", DateTime.UtcNow);
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine("25 kullanıcı eklendi.");
}
