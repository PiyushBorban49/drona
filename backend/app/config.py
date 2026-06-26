import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # ── LLM (Groq) ──────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TEMPERATURE: float = 0.7

    # ── Google Gemini ──────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── Vector Database (MongoDB Atlas) ──────────────────
    EMBEDDING_MODEL: str = "mixedbread-ai/mxbai-embed-large-v1"

    # ── MongoDB ──────────────────────────────────────────
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "AITutor"

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
