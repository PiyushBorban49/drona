"""
Dronacharya v3 — Curriculum Router
Dynamically generates syllabus from Workspaces using RAG.
"""
from typing import Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.schemas.models import TopicRequest, SubtopicVideoRequest
from app.agents.quiz_agent import generate_quiz
from app.services.vector_store import get_workspace_context

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

# In-memory curriculum cache
curriculum_cache: Dict[str, dict] = {}








@router.post("/subtopic/quiz")
async def subtopic_quiz_endpoint(request: SubtopicVideoRequest):
    return generate_quiz(
        topic=request.title,
        context=request.key_points,
        num_questions=3,
    )
