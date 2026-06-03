"""
Dronacharya v3 — MongoDB Client Service
Manages connection to MongoDB for curriculum metadata and user progress.
"""
import os
from pymongo import MongoClient
from pymongo.database import Database
import certifi
from app.config import get_settings

_client: MongoClient | None = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        s = get_settings()
        if not s.MONGODB_URI:
            raise ValueError("MONGODB_URI not found in environment variables")
        _client = MongoClient(s.MONGODB_URI, tlsCAFile=certifi.where())
        try:
            _client.admin.command("ping")
            print("--- MongoDB Connected Successfully ---")
        except Exception as e:
            print(f"--- MongoDB Connection Failed: {e} ---")
            _client = None
            raise e
    return _client

def get_database() -> Database:
    s = get_settings()
    return get_mongo_client()[s.MONGODB_DB_NAME]

def get_subjects_collection():
    return get_database()["subjects"]

def get_srs_collection():
    """Collection for Spaced Repetition System user progress."""
    return get_database()["srs_reviews"]

def get_user_progress_collection():
    """Collection for general user progress tracking."""
    return get_database()["user_progress"]
