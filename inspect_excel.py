import pandas as pd

try:
    df = pd.read_excel('Kitap Bilgileri.xlsx')
    print("Columns in Excel:")
    print(df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head())
except Exception as e:
    print(f"Error: {e}")
