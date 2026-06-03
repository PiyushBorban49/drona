"""
Dronacharya v3 — Video Router
"""
import os
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
import uuid
import shutil
from app.schemas.models import VideoRequest, SubtopicVideoRequest, LongVideoRequest
from app.agents.video_agent import generate_subtopic_video
from app.agents.long_video_agent import generate_course_video
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


@router.post("/long")
async def long_video_endpoint(request: LongVideoRequest):
    result = await generate_course_video(
        topic=request.topic,
        target_duration_minutes=request.target_duration_minutes,
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
