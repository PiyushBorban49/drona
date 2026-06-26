"""
Dronacharya v3 — Video Router
"""
import os
from fastapi import APIRouter, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import json
import uuid
import shutil
from app.schemas.models import VideoRequest, SubtopicVideoRequest
from app.agents.video_agent import generate_subtopic_video
from app.agents.document_agent import process_document


router = APIRouter(prefix="/video", tags=["Video"])


def _make_video_url(result: dict) -> dict:
    """Extract filename from video_path and build the served URL."""
    if result.get("success"):
        video_path = result["video_path"].replace("\\", "/")
        filename = os.path.basename(video_path)
        return {"success": True, "video_url": f"/videos/{filename}"}
    return result


@router.post("")
async def video_endpoint(request: VideoRequest):
    topic = request.topic
    result = await generate_subtopic_video(
        subtopic_id=f"vid_{abs(hash(topic)) % 100000}",
        title=topic,
        description=f"Educational video about {topic}",
        key_points=[],
        model=request.model,
        api_key=request.api_key,
    )
    return _make_video_url(result)


@router.post("/subtopic")
async def subtopic_video_endpoint(request: SubtopicVideoRequest):
    result = await generate_subtopic_video(
        subtopic_id=request.subtopic_id,
        title=request.title,
        description=request.description,
        key_points=request.key_points,
    )
    return _make_video_url(result)



@router.post("/generate-from-file")
async def generate_from_file_endpoint(workspace_id: str = "default", file: UploadFile = File(...)):
    """Upload a document, analyze it, and generate a video based on its content."""
    temp_path = f"tmp/vid_gen_{uuid.uuid4()}_{file.filename}"
    os.makedirs("tmp", exist_ok=True)
    
    try:
        # 1. Save the uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Process document to get topic and analysis
        doc_result = await process_document(temp_path)
        if not doc_result["success"]:
            raise HTTPException(status_code=400, detail=doc_result.get("error", "Document processing failed"))
            
        analysis = doc_result["analysis"]
        # Use summary as the primary topic for video generation
        topic = analysis.get("summary", "Document Overview")[:200]
        key_points = analysis.get("key_points", [])
        
        # 3. Generate video
        video_result = await generate_subtopic_video(
            subtopic_id=f"doc_{str(uuid.uuid4())[:8]}",
            title=doc_result["filename"],
            description=analysis.get("summary"),
            key_points=key_points,
        )
        
        response = _make_video_url(video_result)
        if response.get("success"):
             # Add the topic and analysis metadata and mux playback id to the response
             response["topic"] = topic
             response["analysis"] = analysis
             response["playback_id"] = video_result.get("mux", {}).get("playback_id") if video_result.get("mux") else None
             
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.websocket("/ws")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        # Initial message should contain model, api_key, and topic/title/description
        data = await websocket.receive_text()
        request_data = json.loads(data)
        
        topic = request_data.get("topic", "Educational Video")
        description = request_data.get("description", f"A video about {topic}")
        model = request_data.get("model")
        api_key = request_data.get("api_key")
        
        async def on_progress(event: dict):
            try:
                await websocket.send_text(json.dumps(event))
            except Exception:
                pass # Connection might be closed

        result = await generate_subtopic_video(
            subtopic_id=f"vid_ws_{uuid.uuid4().hex[:8]}",
            title=topic,
            description=description,
            model=model,
            api_key=api_key,
            on_progress=on_progress
        )
        
        # If the result itself wasn't already sent as final_video
        if result.get("success") and "video_path" in result:
            video_url = _make_video_url(result)["video_url"]
            await websocket.send_text(json.dumps({
                "type": "completed",
                "video_url": video_url
            }))
        elif not result.get("success"):
             await websocket.send_text(json.dumps({
                "type": "error",
                "message": result.get("error", "Unknown error occurred")
            }))

    except WebSocketDisconnect:
        print("[VideoWS] Client disconnected")
    except Exception as e:
        print(f"[VideoWS] Error: {e}")
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

