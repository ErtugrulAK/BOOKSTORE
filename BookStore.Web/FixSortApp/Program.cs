using System;
using Npgsql;
using System.Text.RegularExpressions;

var connString = "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=kitapsatisdb";

using (var conn = new NpgsqlConnection(connString))
{
    conn.Open();
    Console.WriteLine("Veritabanına bağlanıldı.");

    using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Name\" FROM \"Books\";", conn))
    using (var reader = cmd.ExecuteReader())
    {
        var books = new System.Collections.Generic.List<(int Id, string Name)>();
        while (reader.Read())
        {
            books.Add((reader.GetInt32(0), reader.GetString(1)));
        }
        reader.Close();

        foreach (var book in books)
        {
            // Eğer ismin sonunda tek bir rakam varsa başına 0 ekle
            // Örn: "Kitap 1" -> "Kitap 01"
            // "Pasif Kitap 5" -> "Pasif Kitap 05"
            
            var match = Regex.Match(book.Name, @"(.*?)\s(\d+)$");
            if (match.Success)
            {
                string prefix = match.Groups[1].Value;
                string numberStr = match.Groups[2].Value;

                if (numberStr.Length == 1)
                {
                    string newName = $"{prefix} 0{numberStr}";
                    var updateCmd = new NpgsqlCommand("UPDATE \"Books\" SET \"Name\" = @name WHERE \"Id\" = @id", conn);
                    updateCmd.Parameters.AddWithValue("name", newName);
                    updateCmd.Parameters.AddWithValue("id", book.Id);
                    updateCmd.ExecuteNonQuery();
                    Console.WriteLine($"{book.Name} -> {newName}");
                }
            }
        }
    }
    Console.WriteLine("Kitap isimleri sıralama için güncellendi.");
}
