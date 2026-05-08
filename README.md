RAG AI Application

A full-stack Retrieval-Augmented Generation (RAG) AI application built with Next.js, FastAPI, OpenAI, and Supabase.

This system allows users to:

Upload PDF documents
Extract and chunk document text
Generate embeddings using OpenAI
Store vectors and metadata
Ask AI-powered questions about uploaded documents
Get contextual answers using RAG architecture
Tech Stack
Frontend
Next.js 14
React.js
Tailwind CSS
Axios
Backend
FastAPI
Python
OpenAI SDK
LangChain (Optional)
PyPDF / PDFPlumber
Database & Storage
Supabase PostgreSQL
Supabase Storage
AI Services
OpenAI Embeddings API
OpenAI Chat Completions API
Features
PDF Upload System
AI Chat Interface
Context-Aware Question Answering
Semantic Search
Text Chunking
Embedding Generation
Vector Similarity Retrieval
Supabase File Storage
Modern Next.js UI
FastAPI REST APIs
Project Structure
rag-app/
│
├── frontend/                        # Next.js Frontend
│
├── backend/                         # FastAPI Backend
│
├── docker-compose.yml
├── .gitignore
└── README.md
Environment Variables
Frontend .env.local

Create:

frontend/.env.local

Add:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
Backend .env

Create:

backend/.env

Add:

OPENAI_API_KEY=YOUR_OPENAI_API_KEY

SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

MODEL_NAME=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
Required Services
1. OpenAI API Key

Get your API key from:

https://platform.openai.com/api-keys

Used for:

Embeddings
Chat Completions
AI Responses
2. Supabase Project

Create a project at:

https://supabase.com

Used for:

PostgreSQL Database
File Storage
Document Metadata
Vector Data
Supabase Setup
Create Storage Bucket

Go to:

Supabase Dashboard → Storage

Create a bucket:

documents

This bucket stores uploaded PDF files.

Create Documents Table

Run SQL:

create table documents (
  id uuid default gen_random_uuid() primary key,
  filename text,
  file_url text,
  uploaded_at timestamp default now()
);
Create Chunks Table
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id),
  chunk_text text,
  embedding vector(1536)
);
Installation
1. Clone Repository
git clone https://github.com/umair6699182/RAG-AI-Assistant.git
cd rag-app
2. Frontend Setup
cd frontend

npm install

Run frontend:

npm run dev

Frontend runs on:

http://localhost:3000
3. Backend Setup
cd backend

python -m venv .venv

Activate venv:

Windows
.venv\Scripts\activate
Linux/Mac
source .venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Run backend:

uvicorn app.main:app --reload

Backend runs on:

http://127.0.0.1:8000
API Endpoints
Upload PDF
POST /upload

Uploads PDF to:

Supabase Storage
Database

Also:

Extracts text
Creates chunks
Generates embeddings
Chat With AI
POST /chat

Request:

{
  "message": "What is this document about?"
}

Response:

{
  "answer": "This document discusses..."
}
RAG Workflow
1. User uploads PDF
2. Backend extracts text
3. Text is chunked
4. OpenAI creates embeddings
5. Embeddings stored in database
6. User asks question
7. Similar chunks retrieved
8. Context sent to OpenAI
9. AI generates contextual response
Main Technologies Used
Technology	Purpose
Next.js	Frontend UI
FastAPI	Backend APIs
OpenAI	AI Responses & Embeddings
Supabase	Database & Storage
Tailwind CSS	Styling
Axios	API Calls
Future Improvements
Authentication
Multi-user support
Streaming AI responses
Chat history
Vector database optimization
Docker deployment
Redis caching
Multi-file support
Drag & Drop uploads
Security Notes
Never expose your OpenAI secret key publicly
Use .env files
Add .env to .gitignore
Use Supabase Service Role Key only on backend
Deployment
Frontend

Deploy on:

Vercel
Backend

Deploy on:

Render
Railway
AWS
DigitalOcean
Author

Developed using:

Next.js
FastAPI
OpenAI
Supabase
License
