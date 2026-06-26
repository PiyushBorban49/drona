from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.user_service import award_xp, update_streak, track_study_time

router = APIRouter(prefix="/user", tags=["User"])

class RewardXPRequest(BaseModel):
    user_id: str
    amount: int

class StudyTimeRequest(BaseModel):
    user_id: str
    minutes: int

class UserIDRequest(BaseModel):
    user_id: str

class ContinueLearningItemRequest(BaseModel):
    user_id: str
    item: dict

@router.post("/stats/reward")
async def reward_xp_endpoint(request: RewardXPRequest):
    result = award_xp(request.user_id, request.amount)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    # Also update streak when XP is awarded
    update_streak(request.user_id)
    
    return result

@router.post("/activity/study")
async def study_time_endpoint(request: StudyTimeRequest):
    result = track_study_time(request.user_id, request.minutes)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result



@router.post("/continue-learning")
async def continue_learning_endpoint(request: ContinueLearningItemRequest):
    from app.services.user_service import track_item_for_later
    result = track_item_for_later(request.user_id, request.item)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result
