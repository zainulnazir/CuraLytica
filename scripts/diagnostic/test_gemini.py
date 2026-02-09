import os
import google.generativeai as genai
from dotenv import load_dotenv
import time

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("No API key found.")
    exit(1)

genai.configure(api_key=api_key)
model_name = 'gemini-2.0-flash-exp' # Trying the one we set
# fallback
# model_name = 'gemini-1.5-flash'

print(f"Testing model: {model_name}")
model = genai.GenerativeModel(model_name)

try:
    start = time.time()
    response = model.generate_content("Hello")
    end = time.time()
    print(f"Response: {response.text}")
    print(f"Time taken: {end - start:.2f}s")
except Exception as e:
    print(f"Error: {e}")
