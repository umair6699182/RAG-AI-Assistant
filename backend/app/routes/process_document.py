from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import fitz
from openai import OpenAI

from app.auth import CurrentUser, get_current_user
from app.core.config import supabase
from app.services.user_data import is_user_storage_path

router = APIRouter()

BUCKET_NAME = "documents"
EMBEDDING_MODEL = "text-embedding-3-small"

openai_client = OpenAI()


class ProcessDocumentRequest(BaseModel):
    storage_path: str = Field(..., min_length=1)
    file_size: int = Field(default=0, ge=0)
    file_name: Optional[str] = None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as document:
        for page in document:
            page_text = page.get_text()

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
async def process_document(
    body: ProcessDocumentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        storage_path = body.storage_path
        file_name = body.file_name or storage_path.split("/")[-1]

        if not is_user_storage_path(storage_path, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="Storage path does not belong to this user",
            )

        # 1. Create document row first
        document_response = supabase.table("documents").insert({
            "storage_path": storage_path,
            "file_name": file_name,
        }).execute()

        if not document_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create document record",
            )

        document_id = document_response.data[0]["id"]

        # 2. Download PDF from Supabase Storage
        file_bytes = supabase.storage.from_(BUCKET_NAME).download(storage_path)

        if not file_bytes:
            raise HTTPException(
                status_code=404,
                detail="File not found in Supabase Storage",
            )

        # 3. Extract text from PDF
        text = extract_text_from_pdf(file_bytes)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF",
            )

        # 4. Split text into chunks
        chunks = chunk_text(text)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No chunks created from document",
            )

        # 5. Create embeddings
        embeddings = create_embeddings(chunks)

        # 6. Store chunks with document_id
        rows = []

        for index, chunk in enumerate(chunks):
            rows.append({
                "document_id": document_id,
                "content": chunk,
                "embedding": embeddings[index],
                "file_id": storage_path,
                "metadata": {
                    "chunk_index": index,
                    "storage_path": storage_path,
                    "file_name": file_name,
                },
            })

        supabase.table("chunks").insert(rows).execute()

        # 7. Return document_id to frontend
        return {
            "message": "Document processed successfully",
            "id": document_id,
            "document_id": document_id,
            "storage_path": storage_path,
            "file_name": file_name,
            "name": file_name,
            "file_size": body.file_size,
            "total_chunks": len(chunks),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )
