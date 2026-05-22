import os
import re
import json

def slugify(text):
    if not text: return ""
    text = text.lower()
    tr_map = {
        'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
    }
    for k, v in tr_map.items():
        text = text.replace(k, v)
    # replace non-alphanumeric with hyphens
    text = re.sub(r'[^a-z0-9]', '-', text)
    # collapse consecutive hyphens
    text = re.sub(r'-+', '-', text)
    # strip leading/trailing hyphens
    return text.strip('-')

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
    
    api_json_path = os.path.join(root_dir, "BookStore.Api", "books_data_v2.json")
    root_json_path = os.path.join(root_dir, "books_data_v2.json")
    
    sql_output_path = os.path.join(root_dir, "update_images_slugified.sql")

    if not os.path.exists(api_json_path):
        print(f"Error: {api_json_path} not found.")
        return

    if not os.path.exists(img_dir):
        print(f"Error: {img_dir} not found.")
        return

    # 1. Rename files to slugified versions
    files = os.listdir(img_dir)
    renamed_files = []
    
    print("=== Renaming files in public/images/books to URL-safe names ===")
    for filename in files:
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
            
        name_part, ext = os.path.splitext(filename)
        slugified_name = slugify(name_part)
        new_filename = f"{slugified_name}{ext.lower()}"
        
        old_path = os.path.join(img_dir, filename)
        new_path = os.path.join(img_dir, new_filename)
        
        if filename != new_filename:
            try:
                if os.path.exists(new_path) and old_path != new_path:
                    os.remove(new_path)
                os.rename(old_path, new_path)
                print(f"Renamed: '{filename}' -> '{new_filename}'")
            except Exception as e:
                print(f"Error renaming '{filename}' to '{new_filename}': {e}")
        
        renamed_files.append(new_filename)

    # Load books from API JSON
    with open(api_json_path, 'r', encoding='utf-8') as f:
        books = json.load(f)

    # Initialize all image URLs to empty to ensure clean sync
    for b in books:
        b["ImageUrl"] = ""

    manual_matches = {
        # Core manual matches
        "bilgisayarprogramlama": "bilisayarprogramlamamatlabuygulamali",
        "endustriyelatiksularinyonetimi": "endustriyelatiksularinyonetilmesi",
        "frenchforengineers": "firansizca", # Match 'Fıransızca'
        "fiziklaboratuvariiideneykitapcigi": "fiziklabii", # Match 'Fizik Lab II'
        "giysikalipciligii": "giysikalipciligi1", # Match 'Giysi Kalıpçılığı-1'
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
        "aktifcamursurecinintasarimuygulamalaricilti": "atiksuaritmasistemlerinintasarimesaslarici",
        "aktifcamursurecinintasarimuygulamalariciltii": "atiksuaritmasistemlerinintasarimesaslaricii",
        "madenjeolojisiuygulamaklavuzu": "madenjeolojisiuygulamakilavuzu",

        # Newly resolved mappings
        "ataturkveaydinlanma": "ataturkveaydinlanma",
        "gecmistengunumuzedunyadasuyapilari": "gecmistengunumuzedunyasuyapilari", # 'Geçmişten Günümüze Dünya Su Yapıları'
        "giysikalipciligi1": "giysikalipciligi1",
        "potansiyelteorivejeofizikuygulamalari": "potansiyelteorijeofizikuygulamalari",
        "sukaynaklarininiyilestirilmesi": "sukaynaklarinigelistirilmesi", # 'Su Kaynaklarını Geliştirilmesi'
        "yeraltimadenmakinelerivemekanizasyonu": "yeraltimadenmakinalarivemekanizasyonu", # 'Yer altı Maden Makinaları Ve Mekanizasyonu'
        "izmirinkurtulusuveyuzbasiserafettin": "ucuncukilic", # Maps to 'Üçünçü  Kılıç'
        "isvezamanetudu": "isvezamanetudu", # 'İş ve zaman etüdü  '
        "turkdevrimtarihii": "turkdevrimtarihi", # 'Türk Devrim Tarihi'
    }

    sql_statements = []
    matched_count = 0

    print("\n=== Matching Slugified Images to Books ===")
    for filename in renamed_files:
        img_name_only = os.path.splitext(filename)[0]
        norm_img = normalize(img_name_only)
        image_url = f"/images/books/{filename}"
        
        matched_name = None
        
        # 1. Try exact normalized match
        for b in books:
            norm_db = normalize(b["Name"])
            if norm_db == norm_img:
                matched_name = b["Name"]
                b["ImageUrl"] = image_url
                break
        
        # 2. Try manual matches
        if not matched_name and norm_img in manual_matches:
            target_norm_db = manual_matches[norm_img]
            for b in books:
                if normalize(b["Name"]) == target_norm_db:
                    matched_name = b["Name"]
                    b["ImageUrl"] = image_url
                    break
        
        # 3. Try "starts with" or "contains"
        if not matched_name:
            for b in books:
                norm_db = normalize(b["Name"])
                if (len(norm_img) > 5 and norm_img in norm_db) or (len(norm_db) > 5 and norm_db in norm_img):
                    matched_name = b["Name"]
                    b["ImageUrl"] = image_url
                    break

        if matched_name:
            escaped_name = matched_name.replace("'", "''")
            sql_statements.append(f"UPDATE \"Books\" SET \"ImageUrl\" = '{image_url}' WHERE \"Name\" = '{escaped_name}';")
            matched_count += 1
            print(f"Matched: '{filename}' -> '{matched_name}'")
        else:
            print(f"FAILED TO MATCH: '{filename}'")

    # Save the updated books JSON to API folder
    with open(api_json_path, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)
    print(f"\nSuccessfully updated API JSON '{api_json_path}' with {matched_count} matching ImageUrls.")

    # Keep the root books_data_v2.json in sync as well
    if os.path.exists(root_json_path):
        with open(root_json_path, 'w', encoding='utf-8') as f:
            json.dump(books, f, ensure_ascii=False, indent=2)
        print(f"Successfully synced root JSON '{root_json_path}'.")

    # Write SQL to file
    with open(sql_output_path, 'w', encoding='utf-8') as f:
        f.write("-- SQL Script to update book image URLs to slugified safe format on the production server\n")
        f.write("BEGIN;\n\n")
        f.write("UPDATE \"Books\" SET \"ImageUrl\" = '';\n\n")
        for stmt in sql_statements:
            f.write(stmt + "\n")
        f.write("\nCOMMIT;\n")

    print(f"Successfully generated SQL update script with {matched_count} matches!")
    print(f"SQL file saved to: {sql_output_path}")

if __name__ == "__main__":
    main()
