import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# =========================
# OpenAI
# =========================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# =========================
# Supabase Core
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

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