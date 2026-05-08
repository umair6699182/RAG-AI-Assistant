from openai import OpenAI

from app.core.config import OPENAI_API_KEY
from app.services.embedding_service import create_embedding
from app.services.vector_service import search_similar_chunks
from app.utils.prompts import build_rag_prompt

client = OpenAI(api_key=OPENAI_API_KEY)

def ask_rag(question: str):
    query_embedding = create_embedding(question)

    relevant_chunks = search_similar_chunks(
        query_embedding=query_embedding,
        top_k=5
    )

    context = "\n\n".join(
        [chunk["text"] for chunk in relevant_chunks]
    )

    prompt = build_rag_prompt(context, question)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    answer = response.choices[0].message.content

    sources = [
        {
            "source": chunk["source"],
            "score": chunk["score"]
        }
        for chunk in relevant_chunks
    ]

    return {
        "answer": answer,
        "sources": sources
    }