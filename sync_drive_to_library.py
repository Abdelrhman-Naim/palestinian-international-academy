import os
import json
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ================= Configuration =================
DRIVE_API_KEY = "AIzaSyDXqTUNs0CR0aTfQooSN5UgxeZ2kC6rKos"
FOLDER_ID = "1tBZLeebMZVQwqAzMGtep6Auaws68IirJ"
PROCESSED_FILES_PATH = "processed_books.json"
FIREBASE_CREDENTIALS = "serviceAccountKey.json" # ضع ملف الاعتماد الخاص بـ Firebase هنا
# =================================================

# 1. Initialize Firebase
if not os.path.exists(FIREBASE_CREDENTIALS):
    print(f"Error: {FIREBASE_CREDENTIALS} not found. Please download it from Firebase Console.")
    exit(1)

cred = credentials.Certificate(FIREBASE_CREDENTIALS)
firebase_admin.initialize_app(cred)
db = firestore.client()

# 2. Load Processed Files
if os.path.exists(PROCESSED_FILES_PATH):
    with open(PROCESSED_FILES_PATH, "r", encoding="utf-8") as f:
        processed_files = json.load(f)
else:
    processed_files = []

# 3. Fetch Files from Google Drive
print("Fetching files from Google Drive...")
url = f"https://www.googleapis.com/drive/v3/files"
params = {
    "q": f"'{FOLDER_ID}' in parents and trashed=false",
    "key": DRIVE_API_KEY,
    "fields": "files(id, name, webViewLink, mimeType, createdTime)"
}

response = requests.get(url, params=params)
if response.status_code != 200:
    print(f"Error fetching from Drive API: {response.text}")
    exit(1)

files = response.json().get("files", [])
print(f"Found {len(files)} files in folder.")

# 4. Process and Upload New Files
new_files_added = 0

for file in files:
    file_id = file.get("id")
    
    if file_id in processed_files:
        continue
    
    title = os.path.splitext(file.get("name"))[0]
    link = file.get("webViewLink")
    
    # تحضير بيانات الكتاب للإضافة إلى Firestore
    book_data = {
        "title": title,
        "author": "غير معروف", # يمكنك تعديله ليناسب مشروعك
        "year": file.get("createdTime")[:4],
        "type": "كتاب",
        "language": "عربي",
        "pages": 0,
        "link": link,
        "driveId": file_id
    }
    
    try:
        db.collection("library").add(book_data)
        processed_files.append(file_id)
        print(f"Added: {title}")
        new_files_added += 1
    except Exception as e:
        print(f"Error adding {title}: {e}")

# 5. Save Processed Files
if new_files_added > 0:
    with open(PROCESSED_FILES_PATH, "w", encoding="utf-8") as f:
        json.dump(processed_files, f, ensure_ascii=False, indent=4)
    print(f"Successfully added {new_files_added} new books.")
else:
    print("No new books found.")
