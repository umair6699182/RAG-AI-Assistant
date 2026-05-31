import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# =========================
# OpenAI
# =========================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# =========================
# Retrieval
# =========================
HYBRID_SEARCH_ENABLED = os.getenv("HYBRID_SEARCH_ENABLED", "true").lower() == "true"
VECTOR_TOP_K = int(os.getenv("VECTOR_TOP_K", "5"))
KEYWORD_TOP_K = int(os.getenv("KEYWORD_TOP_K", "5"))
FINAL_TOP_K = int(os.getenv("FINAL_TOP_K", "5"))
RRF_K = int(os.getenv("RRF_K", "60"))

# =========================
# Supabase Core
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# =========================
# MongoDB Legacy Vector Store
# =========================
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "rag_ai_assistant")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "chunks")

# =========================
# Supabase Storage + DB
# =========================
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "documents")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "chunks")

# =========================
# Supabase Client
# =========================
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)
