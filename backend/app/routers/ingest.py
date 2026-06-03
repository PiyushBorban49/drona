"""
Dronacharya v3 — Ingestion Router
Handles importing knowledge from various sources (RSS, Search, etc.).
"""
from fastapi import APIRouter, HTTPException
from app.schemas.models import RSSIngestRequest, SearchIngestRequest
from app.agents.rss_agent import process_rss_feed
from app.agents.web_search_agent import process_web_search
from app.agents.audio_agent import process_audio_file
from app.agents.ocr_agent import process_ocr_image
from app.agents.dataset_agent import process_dataset
from fastapi import File, UploadFile
import shutil
import os
from app.services.vector_store import ingest_documents
import uuid

router = APIRouter(prefix="/ingest", tags=["Ingestion"])





@router.post("/rss")
async def ingest_rss(request: RSSIngestRequest):
    """Process an RSS/Substack feed and store synthesized knowledge in the Vector Store."""
    try:
        result = await process_rss_feed(request.url)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to process RSS feed"))
        
        # Prepare for ChromaDB ingestion
        analysis = result["analysis"]
        summary = analysis.get("summary", "")
        concepts = analysis.get("concepts", [])
        key_points = analysis.get("key_points", [])
        
        texts = [f"Feed Summary ({result['feed_title']}): {summary}"]
        metadatas = [{
            "workspace_id": request.workspace_id,
            "source": "rss",
            "url": request.url,
            "topic": result["feed_title"],
            "type": "summary"
        }]
        ids = [f"rss_summary_{result['feed_title']}_{str(uuid.uuid4())[:8]}"]
        
        # Ingest concepts
        for concept in concepts:
            texts.append(f"Feed Concept: {concept['title']} - {concept['description']}")
            metadatas.append({
                "workspace_id": request.workspace_id,
                "source": "rss",
                "topic": result["feed_title"],
                "concept_title": concept["title"],
                "type": "concept"
            })
            ids.append(f"rss_concept_{result['feed_title']}_{str(uuid.uuid4())[:8]}")

        # Ingest key points
        if key_points:
            texts.append(f"Key Insights from {result['feed_title']}: " + "; ".join(key_points))
            metadatas.append({
                "workspace_id": request.workspace_id,
                "source": "rss",
                "topic": result["feed_title"],
                "type": "key_points"
            })
            ids.append(f"rss_points_{result['feed_title']}_{str(uuid.uuid4())[:8]}")

        ingest_documents(texts, metadatas, ids)
        
        return {
            "success": True,
            "message": "RSS feed ingested successfully",
            "analysis": analysis,
            "feed_title": result["feed_title"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"RSS ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def ingest_search(request: SearchIngestRequest):
    """Perform a live web search and store findings in the Vector Store."""
    try:
        result = await process_web_search(request.query)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Search failed"))
        
        # Prepare for ChromaDB ingestion
        analysis = result["analysis"]
        summary = analysis.get("summary", "")
        concepts = analysis.get("concepts", [])
        key_points = analysis.get("key_points", [])
        
        texts = [f"Live Search Result ({request.query}): {summary}"]
        metadatas = [{
            "workspace_id": request.workspace_id,
            "source": "search",
            "query": request.query,
            "type": "summary"
        }]
        ids = [f"search_sum_{str(uuid.uuid4())[:8]}"]
        
        # Ingest concepts
        for concept in concepts:
            texts.append(f"Live Concept: {concept['title']} - {concept['description']}")
            metadatas.append({
                "workspace_id": request.workspace_id,
                "source": "search",
                "query": request.query,
                "concept_title": concept["title"],
                "type": "concept"
            })
            ids.append(f"search_con_{str(uuid.uuid4())[:8]}")

        ingest_documents(texts, metadatas, ids)
        
        return {
            "success": True,
            "message": "Search findings ingested successfully",
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Search ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audio")
async def ingest_audio(workspace_id: str, file: UploadFile = File(...)):
    """Upload and transcribe an audio file, then store synthesized knowledge."""
    temp_path = f"tmp/audio_{uuid.uuid4()}_{file.filename}"
    os.makedirs("tmp", exist_ok=True)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await process_audio_file(temp_path, title=file.filename)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Audio processing failed"))
            
        # Ingest into ChromaDB
        analysis = result["analysis"]
        summary = analysis.get("summary", "")
        concepts = analysis.get("concepts", [])
        
        texts = [f"Audio Summary ({file.filename}): {summary}"]
        metadatas = [{
            "workspace_id": workspace_id,
            "source": "audio",
            "filename": file.filename,
            "type": "summary"
        }]
        ids = [f"audio_sum_{str(uuid.uuid4())[:8]}"]
        
        for concept in concepts:
            texts.append(f"Audio Concept: {concept['title']} - {concept['description']}")
            metadatas.append({
                "workspace_id": workspace_id,
                "source": "audio",
                "concept_title": concept["title"],
                "type": "concept"
            })
            ids.append(f"audio_con_{str(uuid.uuid4())[:8]}")
            
        ingest_documents(texts, metadatas, ids)
        
        return {
            "success": True,
            "message": "Audio ingested and synthesized successfully",
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Audio ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/ocr")
async def ingest_ocr(workspace_id: str, file: UploadFile = File(...)):
    """Upload an image (handwritten note), extract text, and store in ChromaDB."""
    temp_path = f"tmp/ocr_{uuid.uuid4()}_{file.filename}"
    os.makedirs("tmp", exist_ok=True)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await process_ocr_image(temp_path)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "OCR processing failed"))
            
        # Ingest into ChromaDB
        analysis = result["analysis"]
        summary = analysis.get("summary", "")
        concepts = analysis.get("concepts", [])
        
        texts = [f"OCR Note Summary ({file.filename}): {summary}"]
        metadatas = [{
            "workspace_id": workspace_id,
            "source": "ocr",
            "filename": file.filename,
            "type": "summary"
        }]
        ids = [f"ocr_sum_{str(uuid.uuid4())[:8]}"]
        
        for concept in concepts:
            texts.append(f"Note Concept: {concept['title']} - {concept['description']}")
            metadatas.append({
                "workspace_id": workspace_id,
                "source": "ocr",
                "concept_title": concept["title"],
                "type": "concept"
            })
            ids.append(f"ocr_con_{str(uuid.uuid4())[:8]}")
            
        ingest_documents(texts, metadatas, ids)
        
        return {
            "success": True,
            "message": "Handwritten note ingested successfully",
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"OCR ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/dataset")
async def ingest_dataset(workspace_id: str, file: UploadFile = File(...)):
    """Upload and analyze a CSV/JSON dataset, then store synthesized findings."""
    temp_path = f"tmp/data_{uuid.uuid4()}_{file.filename}"
    os.makedirs("tmp", exist_ok=True)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await process_dataset(temp_path)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Dataset processing failed"))
            
        # Ingest into ChromaDB
        analysis = result["analysis"]
        summary = analysis.get("summary", "")
        concepts = analysis.get("concepts", [])
        
        texts = [f"Dataset Analysis ({file.filename}): {summary}"]
        metadatas = [{
            "workspace_id": workspace_id,
            "source": "dataset",
            "filename": file.filename,
            "type": "summary"
        }]
        ids = [f"data_sum_{str(uuid.uuid4())[:8]}"]
        
        for concept in concepts:
            texts.append(f"Data Concept: {concept['title']} - {concept['description']}")
            metadatas.append({
                "workspace_id": workspace_id,
                "source": "dataset",
                "concept_title": concept["title"],
                "type": "concept"
            })
            ids.append(f"data_con_{str(uuid.uuid4())[:8]}")
            
        ingest_documents(texts, metadatas, ids)
        
        return {
            "success": True,
            "message": "Dataset analyzed and ingested successfully",
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Dataset ingestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
