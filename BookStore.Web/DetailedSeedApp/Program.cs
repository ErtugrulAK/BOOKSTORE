using System;
using Npgsql;
using BCrypt.Net;

var connString = "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=kitapsatisdb";
var passwordHash = BCrypt.Net.BCrypt.HashPassword("123");

using (var conn = new NpgsqlConnection(connString))
{
    conn.Open();
    Console.WriteLine("Veritabanına bağlanıldı.");

    // Mevcutları temizle
    using (var cleanCmd = new NpgsqlCommand("TRUNCATE \"Books\", \"Users\", \"Orders\", \"OrderItems\", \"ContactMessages\", \"UserAddresses\" CASCADE;", conn)) { cleanCmd.ExecuteNonQuery(); }

    string[] authors = { "Ahmet Yılmaz", "Elif Şafak", "İlber Ortaylı", "Zülfü Livaneli", "Sabahattin Ali", "Doğan Cüceloğlu", "Yaşar Kemal" };
    string[] publishers = { "Can Yayınları", "İş Bankası Kültür Yayınları", "Yapı Kredi Yayınları", "Doğan Kitap", "Pegasus", "Kronik Kitap" };
    string[] categories = { "Çevre Mühendisliği", "Elektrik Elektronik Mühendisliği", "Endüstri Mühendisliği", "Temel Bilimler" };

    // Kitapları Ekle (50 Tane)
    for (int i = 1; i <= 50; i++)
    {
        bool isActive = i <= 40;
        string name = isActive ? $"Kitap {(i < 10 ? "0" + i : i)}" : $"Pasif Kitap {(i-40 < 10 ? "0" + (i-40) : i-40)}";
        int stock = i % 10 == 0 ? 3 : 50; // Bazıları kritik stokta olsun
        
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Books"" 
            (""Name"", ""Author"", ""Price"", ""StockQuantity"", ""MinStockLevel"", ""IsActive"", ""Category"", 
             ""Description"", ""Publisher"", ""ISBN"", ""Language"", ""Dimensions"", ""PublicationYear"", ""PageCount"",
             ""PaymentInfo"", ""ShippingInfo"", ""StoreInfo"") 
            VALUES (@name, @author, @price, @stock, @minStock, @active, @category, 
                    @desc, @pub, @isbn, @lang, @dim, @year, @page,
                    @pay, @ship, @store)", conn);
        
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("author", authors[i % authors.Length]);
        cmd.Parameters.AddWithValue("price", 150.0m + (i * 2));
        cmd.Parameters.AddWithValue("stock", stock);
        cmd.Parameters.AddWithValue("minStock", 10);
        cmd.Parameters.AddWithValue("active", isActive);
        cmd.Parameters.AddWithValue("category", categories[i % categories.Length]);
        cmd.Parameters.AddWithValue("desc", "Bu kitap akademik eğitim ve kişisel gelişim için temel kaynak niteliğindedir. Mühendislik fakülteleri için önerilen müfredat içeriğine sahiptir.");
        cmd.Parameters.AddWithValue("pub", publishers[i % publishers.Length]);
        cmd.Parameters.AddWithValue("isbn", $"978-605-{i:D3}-21-5");
        cmd.Parameters.AddWithValue("lang", "Türkçe");
        cmd.Parameters.AddWithValue("dim", "16x24 cm");
        cmd.Parameters.AddWithValue("year", 2020 + (i % 5));
        cmd.Parameters.AddWithValue("page", 200 + (i * 5));
        cmd.Parameters.AddWithValue("pay", "KDV dahildir. Kredi kartına 6 taksit imkanı.");
        cmd.Parameters.AddWithValue("ship", "24 saat içinde kargoya verilir.");
        cmd.Parameters.AddWithValue("store", "Kampüs mağazalarımızda stokta mevcut.");
        
        cmd.ExecuteNonQuery();
    }
    Console.WriteLine("50 kitap (detaylı) eklendi.");

    // Kullanıcıları Ekle (25 Tane)
    string[] firstNames = { "Mert", "Ali", "Ayşe", "Fatma", "Mehmet", "Zeynep", "Can", "Ece", "Buse", "Oğuz" };
    string[] lastNames = { "Demir", "Kaya", "Öztürk", "Şahin", "Yıldız", "Arslan", "Doğan", "Aydın", "Bulut" };

    for (int i = 1; i <= 25; i++)
    {
        var cmd = new NpgsqlCommand(@"INSERT INTO ""Users"" 
            (""Username"", ""PasswordHash"", ""Role"", ""FirstName"", ""LastName"", ""Email"", ""IsActive"", ""CreatedAt"", ""PhoneNumber"") 
            VALUES (@user, @hash, @role, @f, @l, @email, @active, @date, @phone)", conn);
        
        cmd.Parameters.AddWithValue("user", $"user{i}");
        cmd.Parameters.AddWithValue("hash", passwordHash);
        cmd.Parameters.AddWithValue("role", "User");
        cmd.Parameters.AddWithValue("f", firstNames[i % firstNames.Length]);
        cmd.Parameters.AddWithValue("l", lastNames[i % lastNames.Length]);
        cmd.Parameters.AddWithValue("email", $"user{i}@example.com");
        cmd.Parameters.AddWithValue("active", true);
        cmd.Parameters.AddWithValue("date", DateTime.UtcNow.AddDays(-i));
        cmd.Parameters.AddWithValue("phone", $"0555-{i:D3}-12-34");
        
        cmd.ExecuteNonQuery();
    }

    // Bir de Admin ekle
    var adminCmd = new NpgsqlCommand(@"INSERT INTO ""Users"" 
        (""Username"", ""PasswordHash"", ""Role"", ""FirstName"", ""LastName"", ""Email"", ""IsActive"", ""CreatedAt"", ""PhoneNumber"") 
        VALUES (@user, @hash, @role, @f, @l, @email, @active, @date, @phone)", conn);
    adminCmd.Parameters.AddWithValue("user", "admin");
    adminCmd.Parameters.AddWithValue("hash", passwordHash);
    adminCmd.Parameters.AddWithValue("role", "Admin");
    adminCmd.Parameters.AddWithValue("f", "Admin");
    adminCmd.Parameters.AddWithValue("l", "System");
    adminCmd.Parameters.AddWithValue("email", "admin@mert.com");
    adminCmd.Parameters.AddWithValue("active", true);
    adminCmd.Parameters.AddWithValue("date", DateTime.UtcNow);
    adminCmd.Parameters.AddWithValue("phone", "0500-111-22-33");
    adminCmd.ExecuteNonQuery();

    Console.WriteLine("25 kullanıcı ve 1 admin eklendi.");
}
