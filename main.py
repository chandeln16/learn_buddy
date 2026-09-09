from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv
from urllib.parse import quote

# .env file se keys load karna
load_dotenv()

PIXABAY_KEY = os.getenv("PIXABAY_API_KEY")
SHEET_URL = os.getenv("GOOGLE_SHEET_URL")

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1️⃣ Google Sheet Data laane ka rasta
@app.get("/api/sheet-data")
async def get_sheet_data():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(SHEET_URL, headers=headers)
        
        if response.status_code == 200:
            if "<!DOCTYPE html>" in response.text[:50] or "<html" in response.text[:50].lower():
                print("⚠️ ALERT: Google HTML page bhej raha hai! Sheet ko 'Publish to web' karke CSV link `.env` mein dalein.")
            
            return {"csv_data": response.text}
            
        raise HTTPException(status_code=400, detail="Sheet load nahi hui")

# 2️⃣ Pixabay se Category + Word ke sath HD Image laane ka rasta
@app.get("/api/get-image")
async def get_image(word: str, category: str = ""):
    try:
        # Category aur Word ko mila kar accurate search query banana
        if category and category.lower() != "random":
            search_query = f"{category} {word}"
        else:
            search_query = word

        # Agar PIXABAY_KEY na ho, toh Unsplash fallback use karega
        if not PIXABAY_KEY:
            encoded_query = quote(search_query)
            return {"image_url": f"https://images.unsplash.com/featured/?{encoded_query}"}

        # Pixabay API Endpoint
        url = f"https://pixabay.com/api/?key={PIXABAY_KEY}&q={quote(search_query)}&image_type=photo&per_page=3"
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("hits") and len(data["hits"]) > 0:
                    # Pixabay ki clear photo ka link (webformatURL)
                    return {"image_url": data["hits"][0]["webformatURL"]}
                    
    except Exception as e:
        print(f"⚠️ Pixabay image fetch karne me error aaya: {e}")

    # Fallback agar Pixabay par image na mile
    encoded_word = quote(word)
    return {"image_url": f"https://images.unsplash.com/featured/?{encoded_word}"}