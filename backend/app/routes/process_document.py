from io import BytesIO
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pypdf import PdfReader
from openai import OpenAI

from app.core.config import supabase

router = APIRouter()

BUCKET_NAME = "documents"
EMBEDDING_MODEL = "text-embedding-3-small"

openai_client = OpenAI()


class ProcessDocumentRequest(BaseModel):
    storage_path: str = Field(..., min_length=1)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))

    text_parts = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    return "\n".join(text_parts)


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def create_embeddings(chunks: List[str]) -> List[List[float]]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=chunks,
    )

    return [item.embedding for item in response.data]


@router.post("/process-document")
async def process_document(body: ProcessDocumentRequest):
    try:
        storage_path = body.storage_path

        # 1. Download PDF from Supabase Storage
        file_bytes = supabase.storage.from_(BUCKET_NAME).download(storage_path)

        if not file_bytes:
            raise HTTPException(
                status_code=404,
                detail="File not found in Supabase Storage",
            )

        # 2. Extract text from PDF
        text = extract_text_from_pdf(file_bytes)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF",
            )

        # 3. Split text into chunks
        chunks = chunk_text(text)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No chunks created from document",
            )

        # 4. Create embeddings
        embeddings = create_embeddings(chunks)

        # 5. Store chunks + embeddings in Supabase
        rows = []

        for index, chunk in enumerate(chunks):
            rows.append(
        {
            "content": chunk,
            "embedding": embeddings[index],
            "file_id": storage_path,
            "metadata": {
                "chunk_index": index,
                "storage_path": storage_path,
            },
        }
    )
        supabase.table("chunks").insert(rows).execute()

        return {
            "message": "Document processed successfully",
            "storage_path": storage_path,
            "total_chunks": len(chunks),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )