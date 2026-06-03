"""
Dronacharya v3 — Chat Router
Handles general chat and WebSocket streaming.
"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.models import ChatRequest, SubtopicChatRequest
from app.agents.tutor_agent import general_chat, subtopic_chat
from app.services.vector_store import get_workspace_context
from app.services.tts_service import generate_audio_base64
from app.dependencies import get_llm

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("")
async def chat_endpoint(request: ChatRequest):
    # print("ChatRequest:",request)
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


@router.post("/subtopic")
async def subtopic_chat_endpoint(request: SubtopicChatRequest):
    result = subtopic_chat(
        subtopic_title=request.subtopic_title,
        subtopic_description=request.subtopic_description,
        key_points=request.key_points,
        user_message=request.message,
        chat_history=request.chat_history,
        socratic_mode=request.socratic_mode,
        extract_mastery=request.extract_mastery
    )
    return result


@router.websocket("/stream")
async def chat_stream(ws: WebSocket):
    """WebSocket endpoint for real-time streaming chat with voice."""
    await ws.accept()
    try:
        while True:
            data = await ws.receive_json()
            message = data.get("message", "")
            topic = data.get("topic", "General")
            history = data.get("chat_history", [])

            # Stream response token by token
            llm = get_llm()
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

            system = f"""You are Dronacharya — a legendary, wise NCERT tutor for {topic}.
Use the Socratic method. After explaining, ask a thought-provoking question.
Use analogies from everyday Indian life. Be concise (3-4 sentences per thought).
Speak naturally as if in a real conversation."""

            messages = [SystemMessage(content=system)]
            for msg in history[-8:]:
                if msg.get("role") == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            messages.append(HumanMessage(content=message))

            full_response = ""
            async for chunk in llm.astream(messages):
                token = chunk.content
                if token:
                    full_response += token
                    await ws.send_json({"type": "token", "content": token})

            # Generate audio for the response
            audio_data = await generate_audio_base64(full_response)
            await ws.send_json({
                "type": "complete",
                "content": full_response,
                "audio": audio_data,
            })

    except WebSocketDisconnect:
        print("--- WebSocket disconnected ---")
    except Exception as e:
        print(f"--- WebSocket error: {e} ---")
        try:
            await ws.send_json({"type": "error", "content": str(e)})
        except:
            pass
