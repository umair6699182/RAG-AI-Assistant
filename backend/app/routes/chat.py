import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from openai import OpenAI

from app.auth import CurrentUser, get_current_user
from app.core.config import FINAL_TOP_K, KEYWORD_TOP_K, RRF_K, VECTOR_TOP_K
from app.core.config import supabase
from app.security import rate_limit
from app.services.retrieval_service import search_hybrid_chunks, search_vector_chunks
from app.services.user_data import require_user_conversation, require_user_document

router = APIRouter()

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"
NO_CONTEXT_ANSWER = "I could not find this in your uploaded documents."

openai_client = OpenAI()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    document_id: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    match_count: int = 5
    hybrid_search_enabled: Optional[bool] = None
    vector_top_k: Optional[int] = None
    keyword_top_k: Optional[int] = None
    final_top_k: Optional[int] = None
    rrf_k: Optional[int] = None
    strict_grounded_mode: bool = True


class ChatSource(BaseModel):
    document_id: Optional[str] = None
    filename: Optional[str] = None
    page_number: Optional[int] = None
    chunk_index: Optional[int] = None
    chunk_preview: str
    score: Optional[float] = None
    file_id: Optional[str] = None
    metadata: Optional[dict] = None


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: List[ChatSource]


def create_query_embedding(query: str) -> List[float]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    return response.data[0].embedding


def get_or_create_conversation(
    document_id: str,
    conversation_id: Optional[str],
    user_id: str,
    title: str = "New Chat",
) -> str:
    if conversation_id:
        require_user_conversation(
            conversation_id=conversation_id,
            document_id=document_id,
            user_id=user_id,
        )
        return conversation_id

    response = supabase.table("conversations").insert({
        "user_id": user_id,
        "document_id": document_id,
        "title": title[:80] or "New Chat",
    }).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")

    return response.data[0]["id"]


def save_message(
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    sources: Optional[List[dict]] = None,
):
    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "sources": sources,
    }).execute()


def get_conversation_history(
    conversation_id: str,
    user_id: str,
    limit: int = 10,
) -> List[dict]:
    response = (
        supabase.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )

    return response.data or []


def search_similar_chunks(
    query_embedding: List[float],
    document_id: str,
    match_count: int = 5,
) -> List[dict]:
    return search_vector_chunks(
        query_embedding=query_embedding,
        document_id=document_id,
        top_k=match_count,
    )


def build_context(chunks: List[dict]) -> str:
    context_parts = []

    for index, chunk in enumerate(chunks, start=1):
        content = chunk.get("content", "")
        metadata = dict(chunk.get("metadata") or {})
        page_number = chunk.get("page_number") or metadata.get("page_number")
        chunk_index = chunk.get("chunk_index")

        if chunk_index is None:
            chunk_index = metadata.get("chunk_index")

        source_label = f"Source {index}"
        if page_number is not None:
            source_label += f" | page {page_number}"
        if chunk_index is not None:
            source_label += f" | chunk {chunk_index}"

        context_parts.append(f"{source_label}:\n{content}")

    return "\n\n".join(context_parts)


def build_sources(chunks: List[dict]) -> List[dict]:
    sources = []

    for chunk in chunks:
        metadata = dict(chunk.get("metadata") or {})
        page_number = chunk.get("page_number") or metadata.get("page_number")
        chunk_index = chunk.get("chunk_index")

        if chunk_index is None:
            chunk_index = metadata.get("chunk_index")

        score = chunk.get("score")
        retrieval_type = chunk.get("retrieval_type")
        content = chunk.get("content", "")
        filename = metadata.get("file_name") or metadata.get("filename")

        metadata["score"] = score
        metadata["retrieval_type"] = retrieval_type
        metadata["page_number"] = page_number
        metadata["chunk_index"] = chunk_index

        sources.append({
            "document_id": chunk.get("document_id"),
            "filename": filename,
            "page_number": page_number,
            "chunk_index": chunk_index,
            "chunk_preview": content[:240],
            "score": score,
            "file_id": chunk.get("file_id"),
            "metadata": metadata,
        })

    return sources


def get_retrieval_options(body: ChatRequest) -> dict:
    final_top_k = body.final_top_k or body.match_count or FINAL_TOP_K

    return {
        "hybrid_search_enabled": body.hybrid_search_enabled,
        "vector_top_k": body.vector_top_k or body.match_count or VECTOR_TOP_K,
        "keyword_top_k": body.keyword_top_k or KEYWORD_TOP_K,
        "final_top_k": final_top_k,
        "rrf_k": body.rrf_k or RRF_K,
    }


def get_chat_messages(
    user_message: str,
    context: str,
    history: List[dict],
    strict_grounded_mode: bool = True,
) -> List[dict]:
    system_prompt = f"""
You are a helpful RAG AI assistant.

Use the provided document context to answer the user.

Rules:
- Answer only from the provided document context.
- Use chat history only to understand follow-up questions.
- If the answer is not in the document context, say exactly: "{NO_CONTEXT_ANSWER}"
- Do not make up facts.
- Cite page numbers when the context provides them.
- Keep the answer clear and helpful.
- Strict grounded mode is {'enabled' if strict_grounded_mode else 'disabled'}.
"""

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "system",
            "content": f"Document context:\n\n{context}",
        },
    ]

    for item in history:
        if item["role"] in ["user", "assistant"]:
            messages.append({
                "role": item["role"],
                "content": item["content"],
            })

    messages.append({
        "role": "user",
        "content": user_message,
    })

    return messages


def generate_answer(
    user_message: str,
    context: str,
    history: List[dict],
    strict_grounded_mode: bool,
) -> str:
    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=get_chat_messages(user_message, context, history, strict_grounded_mode),
        temperature=0.2,
    )

    return response.choices[0].message.content or ""


def stream_answer(
    user_message: str,
    context: str,
    history: List[dict],
    sources: List[dict],
    conversation_id: str,
    user_id: str,
    strict_grounded_mode: bool,
):
    full_answer = ""

    try:
        yield f"data: {json.dumps({'type': 'conversation', 'conversation_id': conversation_id})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        stream = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=get_chat_messages(user_message, context, history, strict_grounded_mode),
            temperature=0.2,
            stream=True,
        )

        for chunk in stream:
            token = chunk.choices[0].delta.content

            if token:
                full_answer += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        save_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role="assistant",
            content=full_answer,
            sources=sources,
        )

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(
    body: ChatRequest,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        rate_limit(
            request=request,
            user_id=current_user.id,
            action="chat",
            limit=30,
            window_seconds=60,
        )

        require_user_document(
            document_id=body.document_id,
            user_id=current_user.id,
        )

        conversation_id = get_or_create_conversation(
            document_id=body.document_id,
            conversation_id=body.conversation_id,
            user_id=current_user.id,
            title=body.message,
        )

        history = get_conversation_history(
            conversation_id=conversation_id,
            user_id=current_user.id,
        )

        save_message(
            conversation_id=conversation_id,
            user_id=current_user.id,
            role="user",
            content=body.message,
        )

        query_embedding = create_query_embedding(body.message)

        matched_chunks = search_hybrid_chunks(
            query=body.message,
            query_embedding=query_embedding,
            document_id=body.document_id,
            **get_retrieval_options(body),
        )

        if not matched_chunks:
            answer = NO_CONTEXT_ANSWER if body.strict_grounded_mode else "I could not find relevant information in the uploaded document."

            save_message(
                conversation_id=conversation_id,
                user_id=current_user.id,
                role="assistant",
                content=answer,
                sources=[],
            )

            return {
                "conversation_id": conversation_id,
                "answer": answer,
                "sources": [],
            }

        context = build_context(matched_chunks)
        sources = build_sources(matched_chunks)

        answer = generate_answer(
            user_message=body.message,
            context=context,
            history=history,
            strict_grounded_mode=body.strict_grounded_mode,
        )

        save_message(
            conversation_id=conversation_id,
            user_id=current_user.id,
            role="assistant",
            content=answer,
            sources=sources,
        )

        return {
            "conversation_id": conversation_id,
            "answer": answer,
            "sources": sources,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to chat with document: {str(e)}",
        )


@router.post("/chat/stream")
async def chat_with_document_stream(
    body: ChatRequest,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        rate_limit(
            request=request,
            user_id=current_user.id,
            action="chat_stream",
            limit=30,
            window_seconds=60,
        )

        require_user_document(
            document_id=body.document_id,
            user_id=current_user.id,
        )

        conversation_id = get_or_create_conversation(
            document_id=body.document_id,
            conversation_id=body.conversation_id,
            user_id=current_user.id,
            title=body.message,
        )

        history = get_conversation_history(
            conversation_id=conversation_id,
            user_id=current_user.id,
        )

        save_message(
            conversation_id=conversation_id,
            user_id=current_user.id,
            role="user",
            content=body.message,
        )

        query_embedding = create_query_embedding(body.message)

        matched_chunks = search_hybrid_chunks(
            query=body.message,
            query_embedding=query_embedding,
            document_id=body.document_id,
            **get_retrieval_options(body),
        )

        if not matched_chunks:
            async def no_result_stream():
                answer = NO_CONTEXT_ANSWER if body.strict_grounded_mode else "I could not find relevant information in the uploaded document."

                save_message(
                    conversation_id=conversation_id,
                    user_id=current_user.id,
                    role="assistant",
                    content=answer,
                    sources=[],
                )

                yield f"data: {json.dumps({'type': 'conversation', 'conversation_id': conversation_id})}\n\n"
                yield f"data: {json.dumps({'type': 'token', 'content': answer})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            return StreamingResponse(
                no_result_stream(),
                media_type="text/event-stream",
            )

        context = build_context(matched_chunks)
        sources = build_sources(matched_chunks)

        return StreamingResponse(
            stream_answer(
                user_message=body.message,
                context=context,
                history=history,
                sources=sources,
                conversation_id=conversation_id,
                user_id=current_user.id,
                strict_grounded_mode=body.strict_grounded_mode,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stream chat with document: {str(e)}",
        )
