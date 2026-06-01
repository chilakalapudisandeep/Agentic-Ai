from pymongo import MongoClient
import certifi
import os
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGO_URI")

client = MongoClient(uri, tlsCAFile=certifi.where())

db = client["agentic_ai_db"]

collection = db["chat_history"]

result = collection.insert_one({
    "user_id": "test",
    "prompt": "hello",
    "agent": "test_agent",
    "response": "hi"
})

print("Inserted:", result.inserted_id)