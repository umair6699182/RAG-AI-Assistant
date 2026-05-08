from pymongo import MongoClient
from app.core.config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME

client = MongoClient(MONGO_URI)

db = client[DATABASE_NAME]
chunks_collection = db[COLLECTION_NAME]