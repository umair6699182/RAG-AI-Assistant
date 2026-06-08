from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.auth import CurrentUser, get_current_user
from app.core.config import supabase
from app.services.user_data import (
    is_user_storage_path,
    require_user_conversation,
    require_user_document,
)

router = APIRouter()
BUCKET_NAME = "documents"


@router.get("/documents")
def get_documents(current_user: CurrentUser = Depends(get_current_user)):
    response = (
        supabase.table("documents")
        .select("id, storage_path, file_name, file_size, total_chunks, status, error_message, created_at")
        .execute()
    )

    documents = []

    for row in response.data or []:
        if not is_user_storage_path(row.get("storage_path"), current_user.id):
            continue

        file_name = row.get("file_name") or row.get("storage_path", "").split("/")[-1]
        total_chunks = get_total_chunks(row["id"])

        documents.append({
            "id": row["id"],
            "document_id": row["id"],
            "name": file_name,
            "file_name": file_name,
            "storage_path": row.get("storage_path"),
            "file_size": row.get("file_size") or 0,
            "total_chunks": row.get("total_chunks") or total_chunks,
            "status": row.get("status") or "completed",
            "error_message": row.get("error_message"),
            "created_at": row.get("created_at"),
        })

    return {
        "documents": documents,
    }


@router.get("/documents/{document_id}/messages")
def get_document_messages(
    document_id: str,
    conversation_id: Optional[str] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
):
    require_user_document(document_id=document_id, user_id=current_user.id)

    if conversation_id:
        conversation = require_user_conversation(
            conversation_id=conversation_id,
            document_id=document_id,
            user_id=current_user.id,
        )
    else:
        conversation_response = (
            supabase.table("conversations")
            .select("id, document_id, title")
            .eq("document_id", document_id)
            .limit(1)
            .execute()
        )

        conversation = (
            conversation_response.data[0]
            if conversation_response.data
            else None
        )

    if not conversation:
        return {
            "conversation_id": None,
            "messages": [],
        }

    messages_response = (
        supabase.table("messages")
        .select("id, role, content, sources, created_at")
        .eq("conversation_id", conversation["id"])
        .order("created_at", desc=False)
        .execute()
    )

    return {
        "conversation_id": conversation["id"],
        "messages": messages_response.data or [],
    }


@router.delete("/documents/{document_id}/conversations/{conversation_id}")
def delete_document_conversation(
    document_id: str,
    conversation_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    require_user_document(document_id=document_id, user_id=current_user.id)
    require_user_conversation(
        conversation_id=conversation_id,
        document_id=document_id,
        user_id=current_user.id,
    )

    supabase.table("messages").delete().eq(
        "conversation_id",
        conversation_id,
    ).execute()

    supabase.table("conversations").delete().eq(
        "id",
        conversation_id,
    ).eq("document_id", document_id).execute()

    return {
        "message": "Conversation deleted",
        "conversation_id": conversation_id,
    }


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    document = require_user_document(
        document_id=document_id,
        user_id=current_user.id,
    )

    conversation_response = (
        supabase.table("conversations")
        .select("id")
        .eq("document_id", document_id)
        .execute()
    )

    for conversation in conversation_response.data or []:
        supabase.table("messages").delete().eq(
            "conversation_id",
            conversation["id"],
        ).execute()

    supabase.table("conversations").delete().eq(
        "document_id",
        document_id,
    ).execute()

    supabase.table("chunks").delete().eq(
        "document_id",
        document_id,
    ).execute()

    storage_path = document.get("storage_path")
    storage_delete_error = None

    if storage_path:
        try:
            supabase.storage.from_(BUCKET_NAME).remove([storage_path])
        except Exception as exc:
            storage_delete_error = str(exc)

    supabase.table("documents").delete().eq("id", document_id).execute()

    return {
        "message": "Document deleted",
        "document_id": document_id,
        "storage_delete_error": storage_delete_error,
    }


def get_total_chunks(document_id: str) -> int:
    response = (
        supabase.table("chunks")
        .select("id")
        .eq("document_id", document_id)
        .execute()
    )

    return len(response.data or [])
