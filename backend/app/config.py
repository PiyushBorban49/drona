import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # ── LLM (Groq) ──────────────────────────────────────
    GROQ_API_KEY: str = ""
    # llama-3.3-70b-versatile: non-reasoning → returns message.content directly,
    # and comfortably fits free-tier TPM budgets. If you explicitly want a
    # reasoning model (openai/gpt-oss-*), pin GROQ_MODEL in your .env —
    # mindmap_agent auto-adjusts (reasoning_effort=low + TPM-safe budgets).
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TEMPERATURE: float = 0.7

    # ── Google Gemini ──────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── InsForge Backend-as-a-Service ───────────────────
    INSFORGE_URL: str = ""                # e.g. https://<appkey>.us-east.insforge.app
    INSFORGE_API_KEY: str = ""            # admin API key (ik_...) — server-side only
    INSFORGE_ANON_KEY: str = ""           # optional; only used for proxied signup flows

    # Embeddings run through the InsForge AI gateway (OpenRouter)
    EMBEDDING_MODEL: str = "openai/text-embedding-3-small"

    # ── Storage buckets (InsForge Storage) ───────────────
    VIDEO_BUCKET: str = "videos"
    KEYFRAME_BUCKET: str = "keyframes"

    # ── TTS ──────────────────────────────────────────────
    EDGE_TTS_VOICE: str = "en-US-ChristopherNeural"

    # ── Server ───────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ── Mux ───────────────────────────────────────────
    MUX_TOKEN_ID: str = ""
    MUX_SECRET_KEY: str = ""

    # ── Remotion ─────────────────────────────────────────
    REMOTION_URL: str = "http://localhost:3000"

    model_config = {
        "env_file": os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()
