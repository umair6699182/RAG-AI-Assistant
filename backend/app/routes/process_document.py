from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
import fitz
from openai import OpenAI

from app.auth import CurrentUser, get_current_user
from app.core.config import supabase
from app.security import rate_limit, validate_pdf_metadata
from app.services.user_data import is_user_storage_path

router = APIRouter()

BUCKET_NAME = "documents"
EMBEDDING_MODEL = "text-embedding-3-small"

openai_client = OpenAI()


class ProcessDocumentRequest(BaseModel):
    storage_path: str = Field(..., min_length=1)
    file_size: int = Field(..., gt=0)
    file_name: Optional[str] = None


def extract_pages_from_pdf(file_bytes: bytes) -> List[dict]:
    pages = []

    with fitz.open(stream=file_bytes, filetype="pdf") as document:
        for page_index, page in enumerate(document, start=1):
            page_text = page.get_text()

            if page_text and page_text.strip():
                pages.append({
                    "page_number": page_index,
                    "text": page_text,
                })

    return pages


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
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    document_id = None

    try:
        storage_path = body.storage_path
        file_name = body.file_name or storage_path.split("/")[-1]

        rate_limit(
            request=request,
            user_id=current_user.id,
            action="process_document",
            limit=5,
            window_seconds=60,
        )

        if not is_user_storage_path(storage_path, current_user.id):
            raise HTTPException(
                status_code=403,
                detail="Storage path does not belong to this user",
            )

        validate_pdf_metadata(
            filename=file_name,
            file_size=body.file_size,
        )

        # 1. Create document row first
        document_response = supabase.table("documents").insert({
            "user_id": current_user.id,
            "storage_path": storage_path,
            "file_name": file_name,
            "file_size": body.file_size,
            "status": "pending",
            "error_message": None,
        }).execute()

        if not document_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create document record",
            )

        document_id = document_response.data[0]["id"]

        supabase.table("documents").update({
            "status": "processing",
            "error_message": None,
        }).eq("id", document_id).execute()

        # 2. Download PDF from Supabase Storage
        file_bytes = supabase.storage.from_(BUCKET_NAME).download(storage_path)

        if not file_bytes:
            raise HTTPException(
                status_code=404,
                detail="File not found in Supabase Storage",
            )

        if len(file_bytes) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty",
            )

        if body.file_size and len(file_bytes) > body.file_size:
            validate_pdf_metadata(filename=file_name, file_size=len(file_bytes))

        # 3. Extract text from PDF, preserving page numbers
        pages = extract_pages_from_pdf(file_bytes)

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF",
            )

        # 4. Split text into chunks
        chunk_rows = []

        for page in pages:
            for page_chunk_index, chunk in enumerate(chunk_text(page["text"])):
                chunk_rows.append({
                    "content": chunk,
                    "page_number": page["page_number"],
                    "page_chunk_index": page_chunk_index,
                })

        if not chunk_rows:
            raise HTTPException(
                status_code=400,
                detail="No chunks created from document",
            )

        # 5. Create embeddings
        embeddings = create_embeddings([chunk["content"] for chunk in chunk_rows])

        # 6. Store chunks with document_id
        rows = []

        for index, chunk in enumerate(chunk_rows):
            rows.append({
                "user_id": current_user.id,
                "document_id": document_id,
                "content": chunk["content"],
                "embedding": embeddings[index],
                "file_id": storage_path,
                "page_number": chunk["page_number"],
                "chunk_index": index,
                "metadata": {
                    "chunk_index": index,
                    "page_chunk_index": chunk["page_chunk_index"],
                    "page_number": chunk["page_number"],
                    "storage_path": storage_path,
                    "file_name": file_name,
                    "document_id": document_id,
                    "document": {
                        "id": document_id,
                        "filename": file_name,
                        "storage_path": storage_path,
                        "file_size": body.file_size,
                    },
                },
            })

        supabase.table("chunks").insert(rows).execute()

        supabase.table("documents").update({
            "status": "completed",
            "error_message": None,
            "total_chunks": len(chunk_rows),
        }).eq("id", document_id).execute()

        # 7. Return document_id to frontend
        return {
            "message": "Document processed successfully",
            "id": document_id,
            "document_id": document_id,
            "storage_path": storage_path,
            "file_name": file_name,
            "name": file_name,
            "file_size": body.file_size,
            "total_chunks": len(chunk_rows),
            "status": "completed",
            "error_message": None,
        }

    except HTTPException as exc:
        if document_id:
            supabase.table("documents").update({
                "status": "failed",
                "error_message": str(exc.detail),
            }).eq("id", document_id).execute()
        raise

    except Exception as e:
        if document_id:
            supabase.table("documents").update({
                "status": "failed",
                "error_message": str(e),
            }).eq("id", document_id).execute()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )
