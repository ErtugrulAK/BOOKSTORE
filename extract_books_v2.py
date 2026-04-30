import pandas as pd
import json
import math

def clean_value(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

def to_float(v):
    try:
        if pd.isna(v): return 0.0
        val = float(v)
        if math.isnan(val): return 0.0
        return val
    except:
        return 0.0

def to_int(v):
    try:
        if pd.isna(v): return 0
        val = float(v)
        if math.isnan(val): return 0
        return int(val)
    except:
        return 0

df = pd.read_excel('../Kitap Bilgileri.xlsx')
df.columns = [c.strip() for c in df.columns]

books = []
for _, row in df.iterrows():
    author_raw = clean_value(row.get('Yazar(lar)'))
    
    book = {
        "Name": clean_value(row.get('Kitap Adı')),
        "Price": to_float(row.get('Fiyat')),
        "PageCount": to_int(row.get('Sayfa\nSayısı')),
        "Publisher": clean_value(row.get('Yayınevi')),
        "Category": clean_value(row.get('Bölüm')),
        "Language": clean_value(row.get('Dil')) or "Türkçe",
        "Author": author_raw,
        "PublicationYear": to_int(row.get('Yıl')) or None,
        "Edition": str(clean_value(row.get('Baskı Sayısı')) or ""),
        "ISBN": str(clean_value(row.get('ISBN No')) or ""),
        "StockQuantity": to_int(row.get('Stok')),
        "Description": clean_value(row.get('Açıklama\n(Maks. 50 Kelime)')),
        "IsActive": True,
        "IsFeatured": False,
        "MinStockLevel": 25,
        "PaymentInfo": "KDV dahildir. Güvenli ödeme altyapısı ile sipariş verebilirsiniz.",
        "StoreInfo": "Mağazalarımızdan hemen teslim alabilirsiniz."
    }
    books.append(book)

with open('books_data_v2.json', 'w', encoding='utf-8') as f:
    json.dump(books, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(books)} books to books_data_v2.json")
