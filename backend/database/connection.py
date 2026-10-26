"""
Database connection and helper utilities for MongoDB.
Gracefully handles MongoDB connection availability and provides fallback guidance.
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("sangam.database")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "sangam_dfl_db")

_client = None

def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2500)
    return _client

def get_database(db_name: str = DB_NAME):
    client = get_mongo_client()
    return client[db_name]

def verify_mongo_connection() -> bool:
    """Synchronous ping check to verify MongoDB is running."""
    try:
        sync_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        sync_client.admin.command('ping')
        sync_client.close()
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.warning(f"MongoDB not reachable at {MONGO_URI}: {e}")
        return False
