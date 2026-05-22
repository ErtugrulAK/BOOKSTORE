import os
import re
import json

def normalize(text):
    if not text: return ""
    text = text.lower()
    tr_map = {
        'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
    }
    for k, v in tr_map.items():
        text = text.replace(k, v)
    return re.sub(r'[^a-z0-9]', '', text)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.join(root_dir, "BookStore.Web")
    img_dir = os.path.join(web_dir, "public", "images", "books")
    json_path = os.path.join(root_dir, "books_data_v2.json")
    sql_output_path = os.path.join(root_dir, "update_images.sql")

    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    if not os.path.exists(img_dir):
        print(f"Error: {img_dir} not found.")
        return

    # Load books from JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        books = json.load(f)

    manual_matches = {
        "bilgisayarprogramlama": "bilisayarprogramlamamatlabuygulamali",
        "endustriyelatiksularinyonetimi": "endustriyelatiksularinyonetilmesi",
        "frenchforengineers": "fransizca",
        "fiziklaboratuvariiideneykitapcigi": "fiziklabii",
        "giysikalipciligii": "giysikalipci1",
        "insaatmuhendisleriicinmalzemebilgisi": "malzemebilgisiinsmuhicin",
        "isletmeyonetimiveorganizasyonu": "isletmeyontemiveorganizasyonu",
        "jeofiziktesinyalanalizi": "jeofiziksinyalanalizi",
        "katiatiktoplamatasimavebertarafsistemlerinineniyilenmesiveekonomisi": "katiatiktoplamatasbertarafsis",
        "kilmineralleri": "kilmineralleridersnotlari",
        "kim1016organikkimyauygulamadeneyleri": "genelkimyaicinlabdeneyleri",
        "kimyalaboratuvarideneyleri": "genelkimyaicinlabdeneylerikitap",
        "madenlerdesuaritimivepompalar": "madenlerdesuatimivepompalar",
        "matematikiilineercebir": "matematikilineercebir",
        "potansiyelteorivejeofizikuygulamalari": "potansiyelteorijeofizikuygulamalari",
        "sukaynaklarininkiyilestirilmesi": "sukaynaklarinigelistirilmesi",
        "sukuvvetisuyapilari": "sukuvvetisuyapilariciltix",
        "sukuvvetitesislerindesayisalornekler": "sukuvvetitessayisalornekle",
        "turkdevrimtarihii": "turkdevrimtarihi",
        "uretimplanama": "uretimplanlama",
        "mineraloji": "minerolojigenelminerolojicilti",
        "yeraltimadenmakineleriivemekanizasyonu": "yeraltimadenmakinalarivemekanizasyonu",
        "cevremuhendiligindemikrobiyolojikuygulamalar": "cevremuhendisligindemikrobiyolojikuygulamalar",
        "cevreuhendisligindebiyoprosesler": "cevremuhendisligindebiyoprosesler",
        "izmirinkurtulusuveyuzbasiserafettin": "insakilik",
        "aktifcamursurecinintasarimuygulamalaricilti": "atiksuaritmasistemlerinintasarimesaslarici",
        "aktifcamursurecinintasarimuygulamalariciltii": "atiksuaritmasistemlerinintasarimesaslaricii",
        "madenjeolojisiuygulamaklavuzu": "madenjeolojisiuygulamakilavuzu",
    }

    files = os.listdir(img_dir)
    sql_statements = []
    matched_count = 0

    for filename in files:
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
            
        img_name_only = os.path.splitext(filename)[0]
        norm_img = normalize(img_name_only)
        image_url = f"/images/books/{filename}"
        
        matched_name = None
        
        # 1. Try exact normalized match
        for b in books:
            norm_db = normalize(b["Name"])
            if norm_db == norm_img:
                matched_name = b["Name"]
                break
        
        # 2. Try manual matches
        if not matched_name and norm_img in manual_matches:
            target_norm_db = manual_matches[norm_img]
            for b in books:
                if normalize(b["Name"]) == target_norm_db:
                    matched_name = b["Name"]
                    break
        
        # 3. Try "starts with" or "contains"
        if not matched_name:
            for b in books:
                norm_db = normalize(b["Name"])
                if (len(norm_img) > 5 and norm_img in norm_db) or (len(norm_db) > 5 and norm_db in norm_img):
                    matched_name = b["Name"]
                    break

        if matched_name:
            # Escape single quotes in book names for SQL
            escaped_name = matched_name.replace("'", "''")
            sql_statements.append(f"UPDATE \"Books\" SET \"ImageUrl\" = '{image_url}' WHERE \"Name\" = '{escaped_name}';")
            matched_count += 1
        else:
            print(f"FAILED TO MATCH IMAGE: {filename}")

    # Write SQL to file
    with open(sql_output_path, 'w', encoding='utf-8') as f:
        f.write("-- SQL Script to update book image URLs on the production server\n")
        f.write("BEGIN;\n\n")
        for stmt in sql_statements:
            f.write(stmt + "\n")
        f.write("\nCOMMIT;\n")

    print(f"\nSuccessfully generated SQL update script with {matched_count} matches!")
    print(f"SQL file saved to: {sql_output_path}")

if __name__ == "__main__":
    main()
