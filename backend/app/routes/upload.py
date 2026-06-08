import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user
from app.core.config import supabase
from app.security import rate_limit, validate_pdf_metadata

router = APIRouter()

BUCKET_NAME = "documents"


class CreateUploadRequest(BaseModel):
    filename: str = Field(..., min_length=1)
    file_size: int = Field(..., gt=0)
    content_type: str = "application/pdf"


@router.post("/create-upload-url")
async def create_upload_url(
    body: CreateUploadRequest,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        rate_limit(
            request=request,
            user_id=current_user.id,
            action="create_upload_url",
            limit=5,
            window_seconds=60,
        )
        validate_pdf_metadata(
            filename=body.filename,
            file_size=body.file_size,
            content_type=body.content_type,
        )

        file_id = str(uuid.uuid4())

        safe_filename = body.filename.replace(" ", "_")
        storage_path = f"uploads/{current_user.id}/{file_id}-{safe_filename}"

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
