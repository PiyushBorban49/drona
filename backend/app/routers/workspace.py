"""
Dronacharya v3 — Workspace Router
Handles user workspace creation and document ingestion (PDFs, TXT).
"""
import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import List

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.vector_store import ingest_documents

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

# In-memory "database" of workspaces for the hackathon prototype.
# In a real app, this goes to MongoDB/Postgres.
WORKSPACES_DB = {}


class WorkspaceCreateRequest(BaseModel):
    name: str
    description: str = ""


class WorkspaceResponse(BaseModel):
    workspace_id: str
    name: str
    description: str
    document_count: int


@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(request: WorkspaceCreateRequest):
    """Create a new empty workspace container for RAG documents."""
    workspace_id = f"ws_{uuid.uuid4().hex[:8]}"
    
    workspace = {
        "workspace_id": workspace_id,
        "name": request.name,
        "description": request.description,
        "document_count": 0,
    }
    WORKSPACES_DB[workspace_id] = workspace
    return workspace


@router.get("/", response_model=List[WorkspaceResponse])
async def list_workspaces():
    """List all available workspaces."""
    return list(WORKSPACES_DB.values())


@router.post("/{workspace_id}/upload")
async def upload_document(workspace_id: str, file: UploadFile = File(...)):
    """Upload a PDF or TXT file to a workspace, process into embeddings, and store in the Vector Store."""
    if workspace_id not in WORKSPACES_DB:
        # Auto-create if not found (for easy testing during hackathon)
        WORKSPACES_DB[workspace_id] = {
            "workspace_id": workspace_id,
            "name": f"Workspace {workspace_id}",
            "description": "Auto-created workspace",
            "document_count": 0
        }
        
    # 1. Save file temporarily
    temp_dir = "tmp/uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. Extract Text using LangChain Document Loaders
        if file.filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            documents = loader.load()
        elif file.filename.endswith(".txt"):
            loader = TextLoader(file_path)
            documents = loader.load()
        else:
            raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported currently.")
            
        if not documents:
            raise HTTPException(status_code=400, detail="Could not extract text from the file.")

        # 3. Chunk text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""],
        )
        chunks = text_splitter.split_documents(documents)
        
        # 4. Ingest to Vector Store
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [{"workspace_id": workspace_id, "source": file.filename, "page": chunk.metadata.get("page", 0)} for chunk in chunks]
        ids = [f"{workspace_id}_{file.filename}_{i}" for i in range(len(chunks))]
        
        # Call vector store
        ingest_documents(texts=texts, metadatas=metadatas, ids=ids)
        
        # Update counter
        WORKSPACES_DB[workspace_id]["document_count"] += 1
        
        return {
            "success": True, 
            "message": f"Successfully ingested {file.filename} ({len(chunks)} chunks).",
            "workspace": WORKSPACES_DB[workspace_id]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
        
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
