from functools import lru_cache
import dns.resolver
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection

from app.config import get_settings

# --- DNS RESOLVER OVERRIDE ---
# Atlas SRV resolution often fails on local DNS (DNS Do53 timeout).
# We force dnspython to use Google & Cloudflare DNS for reliability.
try:
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1']
except Exception as e:
    print(f"⚠️ Warning: Failed to override DNS resolver: {e}")


@lru_cache(maxsize=1)                           # only one result is cached
def get_client() -> MongoClient:
    settings = get_settings()
    if not settings.MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in environment / .env file")
    
    return MongoClient(
        settings.MONGODB_URI,
        connectTimeoutMS=60000,
        serverSelectionTimeoutMS=60000
    )


def get_database() -> Database:
    settings = get_settings()
    return get_client()[settings.MONGODB_DB_NAME]


def get_srs_collection() -> Collection:
    return get_database()["srs_items"]



def list_all_databases_and_collections():
    client = get_client()
    
    print("=== All Databases and Collections ===\n")
    
    for db_name in client.list_database_names():
        db = client[db_name]
        collections = db.list_collection_names()
        
        print(f"📁 Database: {db_name}")
        if collections:
            for coll in collections:
                print(f"   └─ 📋 Collection: {coll}")
        else:
            print("   └─ (no collections)")
        print("-" * 50)


if __name__ == "__main__":
    list_all_databases_and_collections()