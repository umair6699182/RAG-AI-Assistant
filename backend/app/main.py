from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.process_document import router as process_document_router
from app.routes.chat import router as chat_router
from app.routes.documents import router as documents_router
from app.routes.upload import router as upload_router

app = FastAPI(title="RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://rag-ai-assistant-nu.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_document_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(upload_router)


@app.get("/")
def root():
    return {"message": "RAG FastAPI Backend is running"}
