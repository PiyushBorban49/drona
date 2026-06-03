"""
Dronacharya v3 — Request/Response Schemas
All Pydantic models for API validation.
"""
from pydantic import BaseModel
from typing import List, Dict, Optional


# ── Shared ────────────────────────────────────────────
class TopicRequest(BaseModel):
    workspace_id: str
    topic: str


class ChatRequest(BaseModel):
    user_id: str
    message: str
    workspace_id: str
    chat_history: List[Dict[str, str]] = []
    socratic_mode: bool = False
    extract_mastery: bool = False


class SubtopicChatRequest(BaseModel):
    subtopic_id: str
    workspace_id: str
    subtopic_title: str
    subtopic_description: str
    key_points: List[str] = []
    message: str
    chat_history: List[Dict[str, str]] = []
    socratic_mode: bool = False
    extract_mastery: bool = False


class VideoRequest(BaseModel):
    workspace_id: str
    topic: Optional[str] = None
    model: Optional[str] = None       # e.g. "gpt-4o", "claude-opus-4", "gemini-2.5-pro"
    api_key: Optional[str] = None     # user-supplied key for the chosen model


class SubtopicVideoRequest(BaseModel):
    subtopic_id: str
    title: str
    description: str
    key_points: List[str] = []


class LongVideoRequest(BaseModel):
    topic: str
    target_duration_minutes: int = 10



# ── Knowledge Galaxy ─────────────────────────────────
class KnowledgeGraphRequest(BaseModel):
    workspace_id: str
    user_id: str = "default"


# ── SRS ──────────────────────────────────────────────
class SRSReviewRequest(BaseModel):
    user_id: str
    concept_id: str
    quality: int  # 0-5


class SRSAddRequest(BaseModel):
    user_id: str
    concept_id: str
    front: str
    back: str
    topic: str = ""


# ── Scenario (Boss Fight) ───────────────────────────
class ScenarioStartRequest(BaseModel):
    user_id: str
    workspace_id: str
    topic: Optional[str] = None


class ScenarioRespondRequest(BaseModel):
    user_id: str
    scenario_id: str
    user_response: str
    turn_history: List[Dict[str, str]] = []
    scenario_context: str = ""


# ── Debate ───────────────────────────────────────────
class DebateStartRequest(BaseModel):
    workspace_id: str
    topic: Optional[str] = None
    stance_a: str = ""
    stance_b: str = ""


class DebateJudgeRequest(BaseModel):
    debate_id: str
    round_num: int
    argument_a: str
    argument_b: str
    topic: str
    user_verdict: str  # "a", "b", or "draw"
    debate_history: List[Dict[str, str]] = []


# ── Voice ────────────────────────────────────────────
class VoiceChatMessage(BaseModel):
    user_id: str
    message: str
    workspace_id: str
    chat_history: List[Dict[str, str]] = []


# ── Ingestion ────────────────────────────────────────



class RSSIngestRequest(BaseModel):
    workspace_id: str
    url: str


class SearchIngestRequest(BaseModel):
    workspace_id: str
    query: str
