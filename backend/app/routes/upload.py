import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import supabase

router = APIRouter()

BUCKET_NAME = "documents"


class CreateUploadRequest(BaseModel):
    filename: str = Field(..., min_length=1)


@router.post("/create-upload-url")
async def create_upload_url(body: CreateUploadRequest):
    try:
        file_id = str(uuid.uuid4())

        safe_filename = body.filename.replace(" ", "_")
        storage_path = f"uploads/{file_id}-{safe_filename}"

        signed_url_response = supabase.storage.from_(BUCKET_NAME).create_signed_upload_url(
            storage_path
        )

        token = signed_url_response.get("token")

        if not token:
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Supabase did not return an upload token",
                    "supabase_response": signed_url_response,
                },
            )

        return {
            "storage_path": storage_path,
            "token": token,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create signed upload URL: {str(e)}",
        )