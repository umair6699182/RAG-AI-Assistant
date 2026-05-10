from typing import Optional

from fastapi import HTTPException

from app.core.config import supabase


def get_user_document(document_id: str, user_id: str) -> Optional[dict]:
    response = (
        supabase.table("documents")
        .select("id, storage_path, file_name")
        .eq("id", document_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    document = response.data[0]

    if not is_user_storage_path(document.get("storage_path"), user_id):
        return None

    return document


def require_user_document(document_id: str, user_id: str) -> dict:
    document = get_user_document(document_id, user_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found for this user",
        )

    return document


def get_user_conversation(
    conversation_id: str,
    user_id: str,
    document_id: Optional[str] = None,
) -> Optional[dict]:
    query = (
        supabase.table("conversations")
        .select("id, document_id, title")
        .eq("id", conversation_id)
    )

    if document_id:
        query = query.eq("document_id", document_id)

    response = query.limit(1).execute()

    if not response.data:
        return None

    return response.data[0]


def is_user_storage_path(storage_path: Optional[str], user_id: str) -> bool:
    return bool(storage_path and storage_path.startswith(f"uploads/{user_id}/"))


def require_user_conversation(
    conversation_id: str,
    user_id: str,
    document_id: Optional[str] = None,
) -> dict:
    conversation = get_user_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
        document_id=document_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found for this user",
        )

    return conversation
