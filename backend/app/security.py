import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status


MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


class InMemoryRateLimiter:
    def __init__(self):
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        bucket = self.requests[key]
        cutoff = now - window_seconds

        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment and try again.",
            )

        bucket.append(now)


rate_limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def rate_limit(request: Request, user_id: str, action: str, limit: int, window_seconds: int) -> None:
    key = f"{action}:{user_id}:{get_client_ip(request)}"
    rate_limiter.check(key=key, limit=limit, window_seconds=window_seconds)


def validate_pdf_metadata(filename: str, file_size: int, content_type: str = "application/pdf") -> None:
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    if content_type and content_type.lower() not in ALLOWED_PDF_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    if file_size <= 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF size must be 10 MB or smaller.")
