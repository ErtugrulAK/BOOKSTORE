using System;
using Npgsql;

var connString = "Host=localhost;Port=5432;Username=postgres;Password=1234;Database=kitapsatisdb";

string[] categories = {
    "Çevre Mühendisliği",
    "Elektrik Elektronik Mühendisliği",
    "Endüstri Mühendisliği",
    "İnşaat Mühendisliği",
    "Jeofizik Mühendisliği",
    "Jeoloji Mühendisliği",
    "Maden Mühendisliği",
    "Makina Mühendisliği",
    "Tekstil Mühendisliği",
    "Temel Bilimler",
    "Dış Yayınlar"
};

using (var conn = new NpgsqlConnection(connString))
{
    conn.Open();
    Console.WriteLine("Veritabanına bağlanıldı.");

    using (var cmd = new NpgsqlCommand("SELECT \"Id\" FROM \"Books\";", conn))
    using (var reader = cmd.ExecuteReader())
    {
        var ids = new System.Collections.Generic.List<int>();
        while (reader.Read())
        {
            ids.Add(reader.GetInt32(0));
        }
        reader.Close();

        Random rnd = new Random();
        foreach (var id in ids)
        {
            var updateCmd = new NpgsqlCommand("UPDATE \"Books\" SET \"Category\" = @cat WHERE \"Id\" = @id", conn);
            updateCmd.Parameters.AddWithValue("cat", categories[rnd.Next(categories.Length)]);
            updateCmd.Parameters.AddWithValue("id", id);
            updateCmd.ExecuteNonQuery();
        }
    }
    Console.WriteLine("Tüm kitapların kategorileri mühendislik bölümlerine göre güncellendi.");
}
