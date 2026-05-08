from fastapi import APIRouter
from app.database.mongodb import chunks_collection

router = APIRouter()


@router.get("/documents")
def get_documents():
    sources = chunks_collection.distinct("source")

    return {
        "documents": sources
    }