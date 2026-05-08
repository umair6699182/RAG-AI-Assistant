# app/routes/chat.py

import json
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from openai import OpenAI

from app.core.config import supabase

router = APIRouter()

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"

openai_client = OpenAI()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    file_id: Optional[str] = None
    match_count: int = 5


class ChatSource(BaseModel):
    content: str
    file_id: Optional[str] = None
    metadata: Optional[dict] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource]


def create_query_embedding(query: str) -> List[float]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    return response.data[0].embedding


def search_similar_chunks(
    query_embedding: List[float],
    match_count: int = 5,
    file_id: Optional[str] = None,
) -> List[dict]:
    params = {
        "query_embedding": query_embedding,
        "match_count": match_count,
        "filter_file_id": file_id,
    }

    response = supabase.rpc("match_chunks", params).execute()
    return response.data or []


def build_context(chunks: List[dict]) -> str:
    context_parts = []

    for index, chunk in enumerate(chunks, start=1):
        content = chunk.get("content", "")
        context_parts.append(f"Source {index}:\n{content}")

    return "\n\n".join(context_parts)


def build_sources(chunks: List[dict]) -> List[dict]:
    sources = []

    for chunk in chunks:
        sources.append(
            {
                "content": chunk.get("content", ""),
                "file_id": chunk.get("file_id"),
                "metadata": chunk.get("metadata"),
            }
        )

    return sources


def get_chat_messages(user_message: str, context: str) -> List[dict]:
    system_prompt = """
You are a helpful AI assistant.

Answer the user's question using only the provided document context.

Rules:
- If the answer is in the context, answer clearly.
- If the answer is not in the context, say you could not find it in the uploaded document.
- Do not make up facts.
- Keep the answer concise and helpful.
"""

    return [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": f"""
Document context:

{context}

User question:
{user_message}
""",
        },
    ]


def generate_answer(user_message: str, context: str) -> str:
    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=get_chat_messages(user_message, context),
        temperature=0.2,
    )

    return response.choices[0].message.content or ""


def stream_answer(user_message: str, context: str, sources: List[dict]):
    try:
        # Optional: send sources first
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        stream = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=get_chat_messages(user_message, context),
            temperature=0.2,
            stream=True,
        )

        for chunk in stream:
            token = chunk.choices[0].delta.content

            if token:
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(body: ChatRequest):
    try:
        query_embedding = create_query_embedding(body.message)

        matched_chunks = search_similar_chunks(
            query_embedding=query_embedding,
            match_count=body.match_count,
            file_id=body.file_id,
        )

        if not matched_chunks:
            return {
                "answer": "I could not find relevant information in the uploaded document.",
                "sources": [],
            }

        context = build_context(matched_chunks)
        answer = generate_answer(body.message, context)
        sources = build_sources(matched_chunks)

        return {
            "answer": answer,
            "sources": sources,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to chat with document: {str(e)}",
        )


@router.post("/chat/stream")
async def chat_with_document_stream(body: ChatRequest):
    try:
        query_embedding = create_query_embedding(body.message)

        matched_chunks = search_similar_chunks(
            query_embedding=query_embedding,
            match_count=body.match_count,
            file_id=body.file_id,
        )

        if not matched_chunks:
            async def no_result_stream():
                yield f"data: {json.dumps({'type': 'token', 'content': 'I could not find relevant information in the uploaded document.'})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            return StreamingResponse(
                no_result_stream(),
                media_type="text/event-stream",
            )

        context = build_context(matched_chunks)
        sources = build_sources(matched_chunks)

        return StreamingResponse(
            stream_answer(body.message, context, sources),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stream chat with document: {str(e)}",
        )