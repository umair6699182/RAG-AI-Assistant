from datetime import datetime

def create_chunk_document(
    text: str,
    embedding: list,
    source: str,
    chunk_index: int
):
    return {
        "text": text,
        "embedding": embedding,
        "source": source,
        "chunk_index": chunk_index,
        "created_at": datetime.utcnow()
    }
    