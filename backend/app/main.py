import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import chat, content, video, curriculum, scenario, user, ingest


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    os.environ["GROQ_API_KEY"] = s.GROQ_API_KEY
    
    print("=" * 60)
    print("  DRONACHARYA v3 — AI NCERT Tutor")
    print(f"  Powered by Groq ({s.GROQ_MODEL}) + MongoDB Atlas")
    print("=" * 60)
    s = get_settings()
    print(f"  LLM Model : {s.GROQ_MODEL}")
    print(f"  Vector DB : MongoDB Atlas (workspace_embeddings)")
    print(f"  MongoDB   : {'Connected' if s.MONGODB_URI else 'Not configured'}")
    print(f"  TTS Voice : {s.EDGE_TTS_VOICE}")
    print("=" * 60)
    yield
    print("--- Dronacharya shutting down ---")


app = FastAPI(
    title="Dronacharya API",
    description="AI-Powered NCERT Tutor — Knowledge Galaxy, Voice Tutoring, SRS & Boss Fights",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS
s = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=s.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for generated videos (absolute path so it works regardless of CWD)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MEDIA_VIDEOS_DIR = os.path.join(_BACKEND_DIR, "media", "videos")
os.makedirs(_MEDIA_VIDEOS_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=_MEDIA_VIDEOS_DIR), name="videos")

# Keyframes mount
_KEYFRAMES_DIR = os.path.join(_BACKEND_DIR, "media", "keyframes")
os.makedirs(_KEYFRAMES_DIR, exist_ok=True)
app.mount("/keyframes", StaticFiles(directory=_KEYFRAMES_DIR), name="keyframes")

# ── Include all routers ──────────────────────────────
app.include_router(chat.router)
app.include_router(content.router)
app.include_router(video.router)
app.include_router(curriculum.router)
app.include_router(scenario.router)
app.include_router(user.router)
app.include_router(ingest.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "Dronacharya API",
        "version": "3.0.0",
        "status": "running",
        "features": [
            "AI Tutor Chat",
            "Quiz & Flashcards",
            "Mindmaps",
            "Video Generation",
            "Scenario Boss Fights",
        ],
    }


@app.get("/health", tags=["Health"])
def health():
    s = get_settings()
    return {"status": "healthy", "llm": s.GROQ_MODEL}

