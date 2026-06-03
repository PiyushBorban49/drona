"""
Dronacharya v3 — Scenario (Boss Fight) Router
"""
from fastapi import APIRouter
from app.schemas.models import ScenarioStartRequest, ScenarioRespondRequest
from app.agents.scenario_agent import create_scenario, respond_in_scenario
from app.services.vector_store import get_workspace_context

router = APIRouter(prefix="/scenario", tags=["Scenario"])


@router.post("/start")
async def start_scenario(request: ScenarioStartRequest):
    context = get_workspace_context(request.workspace_id, request.topic or "general concepts")
    return create_scenario(
        class_name="Workspace",
        subject="General",
        chapter=1,
        topic=request.topic or "Topic",
        context=context,
    )


@router.post("/respond")
async def respond_to_scenario(request: ScenarioRespondRequest):
    return respond_in_scenario(
        scenario_context=request.scenario_context,
        character="",  # Will use context
        student_role="",
        objective="",
        user_response=request.user_response,
        turn_history=request.turn_history,
    )
