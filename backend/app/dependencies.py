from langchain_groq import ChatGroq
from app.config import get_settings

def get_llm(temperature: float | None = None) -> ChatGroq:
    s = get_settings()
    return ChatGroq(
        model=s.GROQ_MODEL,
        temperature=temperature if temperature is not None else s.GROQ_TEMPERATURE,
        api_key=s.GROQ_API_KEY,
    )

def get_llm_strict() -> ChatGroq:
    """Returns a zero-temperature LLM for structured outputs (quizzes, JSON)."""
    return get_llm(temperature=0.0)
