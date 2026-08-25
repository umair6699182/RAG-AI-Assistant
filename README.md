# 🚀 RAG AI Assistant

An advanced full-stack **Retrieval-Augmented Generation (RAG)** AI platform built using **Next.js**, **FastAPI**, **OpenAI**, and **Supabase**.

This application enables users to upload documents, generate embeddings, perform semantic search, and interact with AI-powered contextual conversations based on their uploaded PDFs and Files.

<img width="1919" height="880" alt="Screenshot 2026-05-11 010728" src="https://github.com/user-attachments/assets/e2b548e3-4365-4b3e-bf5e-aeb7fd24c171" />
<img width="1919" height="879" alt="Screenshot 2026-05-11 010719" src="https://github.com/user-attachments/assets/a4a06dfb-ddcd-4ff9-a6d9-0f22aaa3f010" />
<img width="1919" height="876" alt="Screenshot 2026-05-11 010706" src="https://github.com/user-attachments/assets/1c620ea4-d4bb-4daf-ad05-cc2a4860e2c3" />
<img width="1919" height="875" alt="Screenshot 2026-05-11 010655" src="https://github.com/user-attachments/assets/fbc380d8-8cb1-43cd-bb83-d50a2dec7ed2" />
<img width="1899" height="875" alt="Screenshot 2026-05-09 010011" src="https://github.com/user-attachments/assets/0f164070-06ee-4424-a189-d411b5e82e49" />

---

# ✨ Features

## 🔐 Authentication & User Management
- User authentication system
- User-specific chat sessions
- Secure document ownership
- Personalized conversation history

---

## 💬 AI Chat System
- Context-aware AI conversations
- OpenAI-powered responses
- Semantic retrieval using embeddings
- Multi-document contextual querying
- Conversation persistence

---

## 📄 Document Management
- Upload multiple PDF documents
- Store files in Supabase Storage
- Extract and process document text
- Delete uploaded documents
- User-specific document dashboard

---

## 🧠 Advanced RAG Pipeline
- PDF text extraction
- Intelligent text chunking
- OpenAI embedding generation
- Hybrid retrieval using vector search plus BM25 keyword search
- Reciprocal Rank Fusion for combining retrieval results
- Context injection into LLM prompts

---

## 📚 Chat History
- Persistent conversation history
- Resume previous chats
- Delete conversations
- Organized user-based sessions

---

## ⚙️ Dashboard Tabs

The application includes a modern dashboard with 4 main sections:

| Tab | Description |
|------|-------------|
| 💬 Chat | AI-powered document conversations |
| 📄 Documents | Manage uploaded PDFs |
| 🕘 History | View previous conversations |
| ⚙️ Settings | User account & preferences |

---

# 🛠 Tech Stack

## Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios

---

## Backend
- FastAPI
- Python
- OpenAI SDK

---

## Database & Storage
- Supabase PostgreSQL
- Supabase Storage
- pgvector

---

## AI Services
- OpenAI Embeddings API
- OpenAI Chat Completions API


# 🧠 How RAG Works

```text
1. User uploads PDF documents
2. Backend extracts document text
3. Text is split into chunks
4. OpenAI generates vector embeddings
5. Embeddings stored in PostgreSQL (pgvector)
6. User asks a question
7. Vector search retrieves semantically similar chunks
8. BM25 keyword search retrieves exact text matches such as IDs, error codes, invoice numbers, version numbers, and names
9. Reciprocal Rank Fusion merges both ranked result lists and deduplicates chunks
10. Context sent to OpenAI
11. AI generates contextual response
```

---

# Hybrid Search

Hybrid search is the default retrieval mode for chat. It combines:

- Vector search through the existing Supabase `match_chunks` pgvector RPC for semantic matches, such as "work from home" matching "work remotely".
- BM25 keyword search over the document chunks for exact identifiers, such as `ERR-9823`, `HR-2024-17`, `INV-89372`, or `v2.7.14`.

The app does not add BM25 and vector scores directly because they use different scales. Instead, it applies Reciprocal Rank Fusion (RRF):

```text
fused_score += 1 / (rrf_k + rank)
```

Results are deduplicated by chunk/document identifiers and returned as the final top chunks ordered by fused score. Source metadata includes the fused `score` and `retrieval_type` when available.

Hybrid search can be disabled per request by sending:

```json
{
  "message": "What is this document about?",
  "document_id": "document_uuid",
  "hybrid_search_enabled": false
}
```

---

# 📁 Project Structure

```bash
rag-ai-assistant/
│
├── frontend/                  # Next.js Frontend
│
├── backend/                   # FastAPI Backend
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# ⚙️ Environment Variables

# Frontend

Create:

```bash
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

# Backend

Create:

```bash
backend/.env
```

Add:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_KEY is still accepted as a legacy fallback, but prefer SUPABASE_SERVICE_ROLE_KEY.

MODEL_NAME=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

HYBRID_SEARCH_ENABLED=true
VECTOR_TOP_K=5
KEYWORD_TOP_K=5
FINAL_TOP_K=5
RRF_K=60
```

---

# 🔑 Required Services

## 1. OpenAI API Key

Get your API key from:

```text
https://platform.openai.com/api-keys
```

Used for:
- Embedding generation
- AI responses
- Chat completions

---

## 2. Supabase Project

Create a project at:

```text
https://supabase.com
```

Used for:
- PostgreSQL database
- Vector storage
- Authentication
- File storage
- Chat history

---

# 🗄 Supabase Setup

# Enable pgvector

Run:

```sql
create extension if not exists vector;
```

---

# Create Storage Bucket

Go to:

```text
Supabase Dashboard → Storage
```

Create a bucket named:

```text
documents
```

---

# 📊 Database Schema

## Documents Table

```sql
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  filename text,
  file_url text,
  uploaded_at timestamp default now()
);
```

---

## Document Chunks Table

```sql
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  chunk_text text,
  embedding vector(1536)
);
```

---

## Conversations Table

```sql
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  title text,
  created_at timestamp default now()
);
```

---

## Messages Table

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role text,
  content text,
  created_at timestamp default now()
);
```

---

# 🚀 Installation

# 1. Clone Repository

```bash
git clone https://github.com/umair6699182/RAG-AI-Assistant.git

cd RAG-AI-Assistant
```

---

# 2. Frontend Setup

```bash
cd frontend

npm install
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

# 3. Backend Setup

```bash
cd backend

python -m venv .venv
```

---

## Activate Virtual Environment

### Windows

```bash
.venv\Scripts\activate
```

### Linux / Mac

```bash
source .venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Backend

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```text
http://127.0.0.1:8000
```

---

# 🔌 API Endpoints

# Upload Document

### POST `/upload`

Uploads PDF documents and:
- Extracts text
- Creates chunks
- Generates embeddings
- Stores vectors

---

# Chat With AI

### POST `/chat`

### Request

```json
{
  "message": "What is this document about?",
  "document_id": "document_uuid",
  "conversation_id": "conversation_uuid",
  "hybrid_search_enabled": true,
  "vector_top_k": 5,
  "keyword_top_k": 5,
  "final_top_k": 5,
  "rrf_k": 60
}
```

---

### Response

```json
{
  "answer": "This document discusses..."
}
```

---

# Get Conversations

### GET `/conversations`

Returns all user conversations.

---

# Delete Conversation

### DELETE `/conversation/{id}`

Deletes:
- Conversation
- Associated messages

---

# Get Documents

### GET `/documents`

Returns all uploaded user documents.

---

# Delete Document

### DELETE `/document/{id}`

Deletes:
- PDF file
- Metadata
- Vector embeddings

---

# 🔒 Security Best Practices

- Never expose OpenAI secret keys publicly
- Store secrets in `.env`
- Add `.env` to `.gitignore`
- Use Supabase Service Role Key only on backend
- Never prefix service role keys with `NEXT_PUBLIC_`
- Frontend should only use `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Protect private API routes
- Validate uploaded files
- Keep stronger distributed rate limiting, such as Redis-backed limits, on the deployment roadmap

---

# Production RAG Update

This version adds the first production-grade RAG features:

- Citations with `document_id`, `filename`, `page_number`, `chunk_index`, `chunk_preview`, and retrieval `score` when available.
- Streaming responses from `POST /chat/stream` using Server-Sent Events.
- Non-streaming fallback via `POST /chat`.
- Document processing status: `pending`, `processing`, `completed`, `failed`.
- `error_message` storage for failed document processing.
- Strict grounded mode enabled by default with this no-context response: `I could not find this in your uploaded documents.`
- Basic PDF validation: PDF extension/content type, non-empty file, max 10 MB.
- Basic in-memory rate limiting for chat, upload URL creation, and document processing.

Run the idempotent Supabase migration in:

```text
backend/supabase_user_persistence.sql
```

Minimal migration commands for an existing database:

```sql
alter table public.documents
  add column if not exists status text default 'completed',
  add column if not exists error_message text;

alter table public.documents
  drop constraint if exists documents_status_check;

alter table public.documents
  add constraint documents_status_check
  check (status in ('pending', 'processing', 'completed', 'failed'));

alter table public.chunks
  add column if not exists page_number integer,
  add column if not exists chunk_index integer;

create index if not exists chunks_document_page_chunk_idx
  on public.chunks(document_id, page_number, chunk_index);

create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_count int,
  filter_document_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  file_id text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  similarity double precision
)
language sql stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.file_id,
    chunks.page_number,
    chunks.chunk_index,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from public.chunks
  where chunks.document_id = filter_document_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
```

Updated chat request:

```json
{
  "message": "What does the policy say about refunds?",
  "document_id": "document_uuid",
  "conversation_id": "conversation_uuid",
  "match_count": 5,
  "hybrid_search_enabled": true,
  "strict_grounded_mode": true
}
```

Updated chat response:

```json
{
  "conversation_id": "conversation_uuid",
  "answer": "The policy says ...",
  "sources": [
    {
      "document_id": "document_uuid",
      "filename": "policy.pdf",
      "page_number": 3,
      "chunk_index": 7,
      "chunk_preview": "Relevant text from the retrieved chunk...",
      "score": 0.0328
    }
  ]
}
```

Streaming events:

```text
data: {"type":"conversation","conversation_id":"conversation_uuid"}
data: {"type":"sources","sources":[...]}
data: {"type":"token","content":"partial text"}
data: {"type":"done"}
```

Document status response:

```json
{
  "documents": [
    {
      "document_id": "document_uuid",
      "name": "policy.pdf",
      "storage_path": "uploads/user_uuid/file_uuid-policy.pdf",
      "file_size": 245760,
      "total_chunks": 12,
      "status": "completed",
      "error_message": null
    }
  ]
}
```

Manual setup notes:

- Re-run processing for old documents if you want page-number citations on existing chunks.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in `backend/.env`.
- Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `frontend/.env.local`.
- Create a private Supabase Storage bucket named `documents` and allow users to upload only into `uploads/{user_id}/...`.

---

# 🌟 Future Improvements

- OCR support for scanned PDFs
- Drag & Drop uploads
- Redis caching
- Docker production deployment
- Multi-file contextual retrieval
- AI-generated conversation titles
- Team collaboration support

---

# 🚀 Deployment

## Frontend
Recommended:
- Vercel
- Netlify

---

## Backend
Recommended:
- Render
- AWS
- DigitalOcean

---

# 👨‍💻 Author

Developed by **Umair Malik**

Built using:
- Next.js
- FastAPI
- OpenAI
- Supabase
- PostgreSQL
- pgvector

---

# ⭐ Support

If you found this project useful, consider giving it a **star ⭐** on GitHub.

---

Feel free to fork the repository and submit pull requests.
