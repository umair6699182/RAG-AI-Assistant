# 🚀 RAG AI Assistant

An advanced full-stack **Retrieval-Augmented Generation (RAG)** AI platform built using **Next.js**, **FastAPI**, **OpenAI**, and **Supabase**.

This application enables users to upload documents, generate embeddings, perform semantic search, and interact with AI-powered contextual conversations based on their uploaded PDFs.

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
- Vector similarity retrieval
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
- React.js
- TypeScript
- Tailwind CSS
- Axios

---

## Backend
- FastAPI
- Python
- OpenAI SDK
- LangChain (Optional)

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
7. Similar chunks retrieved using vector search
8. Context sent to OpenAI
9. AI generates contextual response
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
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

MODEL_NAME=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
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
  "conversation_id": "conversation_uuid"
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
- Protect private API routes
- Validate uploaded files

---

# 🌟 Future Improvements

- Streaming AI responses
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
- Railway
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
