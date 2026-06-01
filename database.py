import os
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson.objectid import ObjectId
from dotenv import load_dotenv
import certifi

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "agentic_ai_db"
COLLECTION_NAME = "chat_history"
print("Mongo URI:", MONGO_URI)

def get_db_collection():
    """
    Connects to MongoDB and returns the chat_history collection.
    """
    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsCAFile=certifi.where()
        )
        # Verify connection
        client.admin.command('ping')
        db = client[DB_NAME]
        return db[COLLECTION_NAME]
    except ConnectionFailure as e:
        print(f"MongoDB connection failed: {e}")
        return None
    except Exception as e:
        print(f"An error occurred connecting to MongoDB: {e}")
        return None

def get_user_collection():
    """ Connects to MongoDB and returns the users collection """
    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsCAFile=certifi.where()
        )
        db = client[DB_NAME]
        return db["users"]
    except Exception as e:
        print(f"MongoDB connection failed (users): {e}")
        return None

def verify_user(username: str, password: str) -> bool:
    collection = get_user_collection()
    if collection is None:
        return False
    user = collection.find_one({"username": username})
    if user:
        return user.get("password") == password
    return False

def create_user(username: str, password: str) -> bool:
    collection = get_user_collection()
    if collection is None:
        return False
    user = collection.find_one({"username": username})
    if user:
        return False # User already exists
    new_user = {
        "username": username,
        "password": password,
        "created_at": datetime.utcnow()
    }
    try:
        collection.insert_one(new_user)
        return True
    except Exception as e:
        print(f"Insert failed: {e}")
        return False

def save_chat_history(user_id: str, prompt: str, agent: str, response: str):
    collection = get_db_collection()
    if collection is not None:
        chat_record = {
            "user_id": user_id,
            "prompt": prompt,
            "agent": agent,
            "response": response,
            "timestamp": datetime.utcnow()
        }
        try:
            result = collection.insert_one(chat_record)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Failed to save chat history: {e}")
            return None
    return None

def get_recent_chats(user_id: str, limit: int = 10):
    collection = get_db_collection()
    if collection is not None:
        try:
            cursor = collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"Failed to retrieve chat history: {e}")
            return []
    return []

def delete_chat(chat_id: str):
    collection = get_db_collection()
    if collection is not None:
        try:
            result = collection.delete_one({"_id": ObjectId(chat_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Failed to delete chat: {e}")
            return False
    return False

def update_chat(chat_id: str, updates: dict):
    collection = get_db_collection()
    if collection is not None:
        try:
            result = collection.update_one(
                {"_id": ObjectId(chat_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Failed to update chat: {e}")
            return False
    return False
