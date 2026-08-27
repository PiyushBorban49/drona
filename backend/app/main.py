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
    print(f"  Powered by Groq ({s.GROQ_MODEL}) + InsForge Backend")
    print("=" * 60)
    s = get_settings()
    print(f"  LLM Model : {s.GROQ_MODEL}")
    print(f"  Vector DB : InsForge Postgres (pgvector — workspace_embeddings)")
    print(f"  InsForge  : {'Connected' if s.INSFORGE_URL and s.INSFORGE_API_KEY else 'Not configured!'}")
    print(f"  Auth      : InsForge Auth (Bearer tokens)")
    print(f"  Storage   : buckets '{s.VIDEO_BUCKET}' / '{s.KEYFRAME_BUCKET}'")
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
        "ui": "/app (Gradio control panel — mounted when gradio is installed)",
        "docs": "/docs",
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


# ────────────────────────────────────────────────────────────────
# Optional Gradio control panel
# Auto-mounted wherever `gradio` is importable (e.g. the free
# Hugging Face Gradio-SDK Space in hf-space-backend/). Plain local/
# Docker installs without gradio are completely unaffected.
# Mounted AFTER every router so API routes always win over "/app/*".
# ────────────────────────────────────────────────────────────────
def _build_landing_panel():
    try:
        import gradio as gr  # optional extra
    except Exception:  # ImportError or any gradio runtime quirk → skip UI silently
        return None

    s = get_settings()
    insforge_ok = bool(s.INSFORGE_URL and s.INSFORGE_API_KEY)
    groq_ok = bool(s.GROQ_API_KEY)
    # In-process ping — reuses the exact route handlers above, no sockets.
    def _ping():
        try:
            return {"root": root(), "health": health()}
        except Exception as exc:  # never crash the UI on a bad env
            return {"error": f"{type(exc).__name__}: {exc}"}

    with gr.Blocks(title="Dronacharya v3 — Backend Control Panel") as demo:
        gr.Markdown(
            "# 🎓 Dronacharya v3 — Backend Control Panel\n"
            "FastAPI brain of the **AI NCERT Tutor** · "
            "[open interactive docs](/docs) · [OpenAPI JSON](/openapi.json)"
        )
        with gr.Row():
            gr.Markdown(
                "**🧠 LLM model:** `" + str(s.GROQ_MODEL) + "`\n\n"
                "**⚡ Groq key:** " + ("✅ configured" if groq_ok else "⚠️ MISSING") + "\n\n"
                "**☁️ InsForge backend:** " + ("✅ connected" if insforge_ok else "⚠️ NOT configured") + "\n\n"
                "**🗄 Vector DB:** InsForge Postgres + pgvector · "
                "**🎬 Storage:** buckets on InsForge cloud"
            )
            btn = gr.Button("Ping /health", variant="primary")
            out = gr.JSON(label="Server response")
        btn.click(_ping, inputs=None, outputs=out)
    return demo


try:
    _panel = _build_landing_panel()
    if _panel is not None:
        import gradio as gr

        app = gr.mount_gradio_app(app, _panel, path="/app")
        print("[ui] Gradio control panel mounted at /app")
except Exception as _mount_err:  # a broken panel must NEVER kill the API
    print(f"[ui] control panel not mounted ({type(_mount_err).__name__}: {_mount_err})")

