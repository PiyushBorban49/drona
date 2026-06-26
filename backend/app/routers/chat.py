"""
Dronacharya v3 — Chat Router
Handles general chat and WebSocket streaming.
"""
import json
from fastapi import APIRouter
from app.schemas.models import ChatRequest
from app.agents.tutor_agent import general_chat
from app.services.vector_store import get_workspace_context

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("")
async def chat_endpoint(request: ChatRequest):
    context = get_workspace_context(request.workspace_id, request.message)
    result = general_chat(
        topic=request.message,
        user_message=request.message,
        chat_history=request.chat_history,
        context=context,
        socratic_mode=request.socratic_mode,
        extract_mastery=request.extract_mastery
    )
    return result
