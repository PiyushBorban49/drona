"""
Dronacharya v3 — Curriculum Router
Dynamically generates syllabus from Workspaces using RAG.
"""
from typing import Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.schemas.models import TopicRequest, SubtopicVideoRequest
from app.agents.curriculum_agent import generate_workspace_curriculum
from app.agents.quiz_agent import generate_subtopic_quiz
from app.services.vector_store import get_workspace_context

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

# In-memory curriculum cache
curriculum_cache: Dict[str, dict] = {}


class WorkspaceCurriculumRequest(BaseModel):
    workspace_id: str


@router.post("/generate")
async def generate_curriculum(request: WorkspaceCurriculumRequest):
    wid = request.workspace_id
    if wid in curriculum_cache:
        return {"success": True, "curriculum": curriculum_cache[wid], "cached": True}

    # Fetch a broad context to generate the syllabus (we query for generic topics)
    context = get_workspace_context(wid, query="summary main concepts key ideas topics chapters", top_k=10)
    
    result = generate_workspace_curriculum(wid, context)
    if result.get("success"):
        curriculum_cache[wid] = result["curriculum"]
        return {"success": True, "curriculum": result["curriculum"], "cached": False}
    return result


@router.post("/subtopic/quiz")
async def subtopic_quiz_endpoint(request: SubtopicVideoRequest):
    return generate_subtopic_quiz(
        subtopic_title=request.title,
        subtopic_description=request.description,
        key_points=request.key_points,
        num_questions=3,
    )
