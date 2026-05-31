import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.hybrid_search import bm25_rank, reciprocal_rank_fusion


def test_rrf_keeps_semantic_vector_match():
    vector_results = [
        {
            "id": "remote-policy",
            "document_id": "doc-1",
            "content": "Employees may work remotely up to three days per week.",
            "score": 0.91,
            "retrieval_type": "vector",
        }
    ]
    keyword_results = bm25_rank(
        query="what is the work from home policy?",
        chunks=vector_results,
        top_k=5,
    )

    fused = reciprocal_rank_fusion([vector_results, keyword_results], top_k=1)

    assert fused[0]["chunk_id"] == "remote-policy"
    assert "vector" in fused[0]["retrieval_type"]


def test_bm25_and_rrf_rank_exact_identifier():
    chunks = [
        {
            "id": "general-policy",
            "document_id": "doc-1",
            "content": "Employees may work remotely up to three days per week.",
        },
        {
            "id": "err-9823",
            "document_id": "doc-1",
            "content": "Error ERR-9823: Database connection timeout.",
        },
    ]

    keyword_results = bm25_rank(query="ERR-9823", chunks=chunks, top_k=5)
    fused = reciprocal_rank_fusion([keyword_results], top_k=1)

    assert keyword_results[0]["chunk_id"] == "err-9823"
    assert fused[0]["chunk_id"] == "err-9823"
    assert fused[0]["retrieval_type"] == "keyword"


if __name__ == "__main__":
    test_rrf_keeps_semantic_vector_match()
    test_bm25_and_rrf_rank_exact_identifier()
    print("Hybrid search smoke tests passed.")
