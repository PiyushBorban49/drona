"""
Dronacharya v3 — Debate Router
Multi-agent debate endpoints.
"""
from fastapi import APIRouter
from app.schemas.models import DebateStartRequest, DebateJudgeRequest
from app.agents.debate_agent import start_debate, generate_debate_round, evaluate_judgment
from app.services.vector_store import get_workspace_context

router = APIRouter(prefix="/debate", tags=["Debate"])


@router.post("/start")
async def start_debate_endpoint(request: DebateStartRequest):
    context = get_workspace_context(request.workspace_id, request.topic or "general concepts")
    topic = request.topic or "Workspace Debate"
    return start_debate(topic, request.stance_a, request.stance_b, context)


@router.post("/round")
async def generate_round(request: DebateStartRequest, round_num: int = 1):
    topic = request.topic or "Workspace Debate"
    return generate_debate_round(
        topic=topic,
        stance_a=request.stance_a,
        stance_b=request.stance_b,
        round_num=round_num,
    )


@router.post("/judge")
async def judge_round(request: DebateJudgeRequest):
    return evaluate_judgment(
        topic=request.topic,
        argument_a=request.argument_a,
        argument_b=request.argument_b,
        user_verdict=request.user_verdict,
    )
