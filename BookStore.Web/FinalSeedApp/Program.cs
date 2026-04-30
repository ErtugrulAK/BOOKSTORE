using System;
using Npgsql;
using BCrypt.Net;

var connString = "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=kitapsatisdb";
var passwordHash = BCrypt.Net.BCrypt.HashPassword("123");

using (var conn = new NpgsqlConnection(connString))
{
    conn.Open();
    Console.WriteLine("Veritabanına bağlanıldı.");

    // Mevcutları temizle (isteğe bağlı ama user 50 tane olsun diyor)
    // using (var cleanCmd = new NpgsqlCommand("TRUNCATE \"Books\", \"Users\" CASCADE;", conn)) { cleanCmd.ExecuteNonQuery(); }

    // Kitapları Ekle (50 Tane)
    for (int i = 1; i <= 50; i++)
    {
        bool isActive = i <= 40;
        string name = isActive ? $"Kitap {(i < 10 ? "0" + i : i)}" : $"Pasif Kitap {(i-40 < 10 ? "0" + (i-40) : i-40)}";
        
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Books"" 
            (""Name"", ""Author"", ""Price"", ""StockQuantity"", ""MinStockLevel"", ""IsActive"", ""Category"", ""Description"", ""Publisher"", ""ISBN"", ""Language"") 
            VALUES (@name, @author, @price, @stock, @minStock, @active, @category, NULL, NULL, NULL, NULL)", conn);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("author", $"Yazar {i}");
        cmd.Parameters.AddWithValue("price", 100.0m + i);
        cmd.Parameters.AddWithValue("stock", 50);
        cmd.Parameters.AddWithValue("minStock", 5);
        cmd.Parameters.AddWithValue("active", isActive);
        cmd.Parameters.AddWithValue("category", "Temel Bilimler");
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine("50 kitap eklendi.");

    // Kullanıcıları Ekle (25 Tane)
    for (int i = 1; i <= 25; i++)
    {
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Users"" 
            (""Username"", ""PasswordHash"", ""Role"", ""FirstName"", ""LastName"", ""Email"", ""IsActive"", ""CreatedAt"", ""PhoneNumber"") 
            VALUES (@user, @hash, @role, @f, @l, @email, @active, @date, NULL)", conn);
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
