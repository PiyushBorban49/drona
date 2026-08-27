"""
Dronacharya v3 — User Router (InsForge Auth protected)
All identity-bearing operations now use the authenticated InsForge user
(Authorization: Bearer <accessToken>). The client never asserts user ids.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.auth import AuthUser, get_current_user, get_optional_user
from app.services import user_service

router = APIRouter(prefix="/user", tags=["User"])


class RewardXPRequest(BaseModel):
    amount: int


class StudyTimeRequest(BaseModel):
    minutes: int


class ContinueLearningItemRequest(BaseModel):
    item: dict


@router.get("/stats")
async def get_stats_endpoint(user: AuthUser = Depends(get_current_user)):
    """Full stat block for the authenticated user's dashboard."""
    return {"success": True, "stats": user_service.get_user_stats(user.id)}


@router.post("/stats/reward")
async def reward_xp_endpoint(request: RewardXPRequest,
                             user: AuthUser = Depends(get_current_user)):
    result = user_service.award_xp(user.id, request.amount)
    # Streak advances together with XP awards (previous behaviour)
    streak_result = user_service.update_streak(user.id)
    result["streak"] = streak_result.get("streak")
    return result


@router.post("/activity/study")
async def study_time_endpoint(request: StudyTimeRequest,
                              user: AuthUser = Depends(get_current_user)):
    return user_service.track_study_time(user.id, request.minutes)


@router.post("/continue-learning")
async def continue_learning_endpoint(request: ContinueLearningItemRequest,
                                     user: AuthUser = Depends(get_current_user)):
    return user_service.track_item_for_later(user.id, request.item)
