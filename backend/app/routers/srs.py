"""
Dronacharya v3 — SRS Router
Spaced Repetition System endpoints.
"""
from fastapi import APIRouter
from app.schemas.models import SRSReviewRequest, SRSAddRequest
from app.services.srs_engine import get_due_items, record_review, add_item, get_user_stats

router = APIRouter(prefix="/srs", tags=["Spaced Repetition"])


@router.get("/due")
async def get_due(user_id: str = "default", limit: int = 20):
    items = get_due_items(user_id, limit)
    stats = get_user_stats(user_id)
    return {"success": True, "items": items, "stats": stats}


@router.post("/review")
async def submit_review(request: SRSReviewRequest):
    result = record_review(request.user_id, request.concept_id, request.quality)
    return result


@router.post("/add")
async def add_srs_item(request: SRSAddRequest):
    result = add_item(request.user_id, request.concept_id, request.front, request.back, request.topic)
    return result


@router.get("/stats")
async def get_stats(user_id: str = "default"):
    return get_user_stats(user_id)
