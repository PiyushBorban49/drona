from fastapi import APIRouter
from app.schemas.models import TopicRequest
from app.agents.quiz_agent import generate_quiz, generate_subtopic_quiz
from app.agents.flashcard_agent import generate_flashcards
from app.agents.mindmap_agent import generate_mindmap
from app.services.vector_store import get_workspace_context

router = APIRouter(tags=["Content"])


@router.post("/quiz")
async def quiz_endpoint(request: TopicRequest):
    context = get_workspace_context(request.workspace_id, request.topic)
    topic = request.topic
    return generate_quiz(topic, context)


@router.post("/flashcards")
async def flashcards_endpoint(request: TopicRequest):
    context = get_workspace_context(request.workspace_id, request.topic)
    topic = request.topic
    return generate_flashcards(topic, context)


@router.post("/mindmap")
async def mindmap_endpoint(request: TopicRequest):
    context = get_workspace_context(request.workspace_id, request.topic)
    topic = request.topic
    return generate_mindmap(topic, context)
