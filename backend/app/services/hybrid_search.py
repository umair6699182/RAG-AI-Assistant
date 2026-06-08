import math
import re
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional, Sequence


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*")


def tokenize(text: str) -> List[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(text or "")]


def get_chunk_id(chunk: Dict[str, Any]) -> str:
    chunk_id = (
        chunk.get("chunk_id")
        or chunk.get("id")
        or chunk.get("document_id")
        or chunk.get("file_id")
        or chunk.get("source")
        or chunk.get("content")
        or chunk.get("text")
    )
    return str(chunk_id)


def normalize_chunk(
    chunk: Dict[str, Any],
    score: Optional[float] = None,
    retrieval_type: Optional[str] = None,
) -> Dict[str, Any]:
    metadata = dict(chunk.get("metadata") or {})
    content = chunk.get("content", chunk.get("text", ""))
    chunk_id = chunk.get("chunk_id") or chunk.get("id") or metadata.get("chunk_id")

    normalized = dict(chunk)
    normalized["content"] = content
    normalized["text"] = content
    normalized["chunk_id"] = chunk_id
    normalized["document_id"] = chunk.get("document_id")
    normalized["source"] = (
        chunk.get("source")
        or chunk.get("file_id")
        or metadata.get("source")
        or metadata.get("storage_path")
        or metadata.get("file_name")
    )
    normalized["page_number"] = next(
        (
            value
            for value in [
                chunk.get("page_number"),
                chunk.get("page"),
                metadata.get("page_number"),
                metadata.get("page"),
            ]
            if value is not None
        ),
        None,
    )
    normalized["chunk_index"] = next(
        (
            value
            for value in [
                chunk.get("chunk_index"),
                metadata.get("chunk_index"),
            ]
            if value is not None
        ),
        None,
    )
    normalized["metadata"] = metadata

    if score is not None:
        normalized["score"] = score

    if retrieval_type:
        normalized["retrieval_type"] = retrieval_type

    return normalized


def bm25_rank(
    query: str,
    chunks: Sequence[Dict[str, Any]],
    top_k: int = 5,
    k1: float = 1.5,
    b: float = 0.75,
) -> List[Dict[str, Any]]:
    query_terms = tokenize(query)

    if not query_terms or not chunks:
        return []

    documents = [tokenize(chunk.get("content", chunk.get("text", ""))) for chunk in chunks]
    doc_lengths = [len(document) for document in documents]
    avg_doc_length = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 0

    document_frequency: Counter[str] = Counter()

    for document in documents:
        document_frequency.update(set(document))

    scored_chunks = []
    corpus_size = len(documents)

    for chunk, document, doc_length in zip(chunks, documents, doc_lengths):
        term_frequency = Counter(document)
        score = 0.0

        for term in query_terms:
            frequency = term_frequency.get(term, 0)

            if frequency == 0:
                continue

            idf = math.log(1 + (corpus_size - document_frequency[term] + 0.5) / (document_frequency[term] + 0.5))
            denominator = frequency + k1 * (1 - b + b * doc_length / (avg_doc_length or 1))
            score += idf * (frequency * (k1 + 1)) / denominator

        if score > 0:
            scored_chunks.append(normalize_chunk(chunk, score=score, retrieval_type="keyword"))

    scored_chunks.sort(key=lambda item: item["score"], reverse=True)
    return scored_chunks[:top_k]


def reciprocal_rank_fusion(
    ranked_results: Iterable[Sequence[Dict[str, Any]]],
    top_k: int = 5,
    rrf_k: int = 60,
) -> List[Dict[str, Any]]:
    fused: Dict[str, Dict[str, Any]] = {}

    for results in ranked_results:
        for rank, chunk in enumerate(results, start=1):
            normalized = normalize_chunk(chunk)
            key = get_chunk_id(normalized)
            contribution = 1 / (rrf_k + rank)

            if key not in fused:
                fused[key] = {
                    "chunk": normalized,
                    "score": 0.0,
                    "retrieval_types": set(),
                }

            fused[key]["score"] += contribution

            retrieval_type = normalized.get("retrieval_type")
            if retrieval_type:
                fused[key]["retrieval_types"].update(retrieval_type.split("+"))

    fused_chunks = []

    for item in fused.values():
        chunk = item["chunk"]
        chunk["score"] = item["score"]

        retrieval_types = sorted(item["retrieval_types"])
        chunk["retrieval_type"] = "+".join(retrieval_types) if retrieval_types else "hybrid"

        metadata = dict(chunk.get("metadata") or {})
        metadata["score"] = item["score"]
        metadata["retrieval_type"] = chunk["retrieval_type"]
        chunk["metadata"] = metadata

        fused_chunks.append(chunk)

    fused_chunks.sort(key=lambda chunk: chunk["score"], reverse=True)
    return fused_chunks[:top_k]
