from typing import Dict, List, Optional

from app.core.config import (
    FINAL_TOP_K,
    HYBRID_SEARCH_ENABLED,
    KEYWORD_TOP_K,
    RRF_K,
    VECTOR_TOP_K,
    supabase,
)
from app.services.hybrid_search import bm25_rank, normalize_chunk, reciprocal_rank_fusion


def search_vector_chunks(
    query_embedding: List[float],
    document_id: str,
    top_k: int = VECTOR_TOP_K,
) -> List[dict]:
    params = {
        "query_embedding": query_embedding,
        "match_count": top_k,
        "filter_document_id": document_id,
    }

    response = supabase.rpc("match_chunks", params).execute()

    chunks = []
    for chunk in response.data or []:
        score = chunk.get("score")
        if score is None:
            score = chunk.get("similarity")

        chunks.append(normalize_chunk(chunk, score=score, retrieval_type="vector"))

    return chunks


def search_keyword_chunks(
    query: str,
    document_id: str,
    top_k: int = KEYWORD_TOP_K,
) -> List[dict]:
    response = (
        supabase.table("chunks")
        .select("id, document_id, content, file_id, metadata")
        .eq("document_id", document_id)
        .execute()
    )

    return bm25_rank(query=query, chunks=response.data or [], top_k=top_k)


def search_hybrid_chunks(
    query: str,
    query_embedding: List[float],
    document_id: str,
    hybrid_search_enabled: Optional[bool] = None,
    vector_top_k: Optional[int] = None,
    keyword_top_k: Optional[int] = None,
    final_top_k: Optional[int] = None,
    rrf_k: Optional[int] = None,
) -> List[dict]:
    use_hybrid = HYBRID_SEARCH_ENABLED if hybrid_search_enabled is None else hybrid_search_enabled
    vector_limit = vector_top_k or VECTOR_TOP_K
    keyword_limit = keyword_top_k or KEYWORD_TOP_K
    final_limit = final_top_k or FINAL_TOP_K
    fusion_k = rrf_k or RRF_K

    if not use_hybrid:
        return search_vector_chunks(
            query_embedding=query_embedding,
            document_id=document_id,
            top_k=final_limit,
        )

    vector_results = search_vector_chunks(
        query_embedding=query_embedding,
        document_id=document_id,
        top_k=vector_limit,
    )
    keyword_results = search_keyword_chunks(
        query=query,
        document_id=document_id,
        top_k=keyword_limit,
    )

    return reciprocal_rank_fusion(
        ranked_results=[vector_results, keyword_results],
        top_k=final_limit,
        rrf_k=fusion_k,
    )
