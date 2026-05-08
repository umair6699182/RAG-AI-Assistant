# app/routes/chat.py

from typing import List, Optional, Any

from fastapi import APIRouter, HTTPException
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
    """
    This calls a Supabase RPC function named `match_chunks`.
    You need to create this function in Supabase SQL editor.
    """

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

        context_parts.append(
            f"Source {index}:\n{content}"
        )

    return "\n\n".join(context_parts)


def generate_answer(user_message: str, context: str) -> str:
    system_prompt = """
You are a helpful AI assistant.

Answer the user's question using only the provided document context.

Rules:
- If the answer is in the context, answer clearly.
- If the answer is not in the context, say you could not find it in the uploaded document.
- Do not make up facts.
- Keep the answer concise and helpful.
"""

    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
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
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content or ""


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(body: ChatRequest):
    try:
        # 1. Create embedding for user's question
        query_embedding = create_query_embedding(body.message)

        # 2. Find matching chunks from Supabase
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

        # 3. Build context from matched chunks
        context = build_context(matched_chunks)

        # 4. Generate final answer from OpenAI
        answer = generate_answer(
            user_message=body.message,
            context=context,
        )

        # 5. Return answer + sources
        sources = []

        for chunk in matched_chunks:
            sources.append(
                {
                    "content": chunk.get("content", ""),
                    "file_id": chunk.get("file_id"),
                    "metadata": chunk.get("metadata"),
                }
            )

        return {
            "answer": answer,
            "sources": sources,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to chat with document: {str(e)}",
        )