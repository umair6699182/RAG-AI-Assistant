import math
from app.database.mongodb import chunks_collection

def cosine_similarity(vec1, vec2):
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))

    if norm1 == 0 or norm2 == 0:
        return 0

    return dot / (norm1 * norm2)


def save_chunks(documents):
    if documents:
        chunks_collection.insert_many(documents)


def search_similar_chunks(query_embedding, top_k: int = 5):
    chunks = list(chunks_collection.find({}))

    scored_chunks = []

    for chunk in chunks:
        score = cosine_similarity(query_embedding, chunk["embedding"])
        scored_chunks.append({
            "text": chunk["text"],
            "source": chunk["source"],
            "score": score
        })

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)

    return scored_chunks[:top_k]