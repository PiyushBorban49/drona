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
    # Identity is taken from the Authorization JWT (InsForge Auth); user_id
    # remains accepted-but-ignored for backward compatibility.
    user_id: Optional[str] = None
    message: str
    workspace_id: str
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






# ── Scenario (Boss Fight) ───────────────────────────
class ScenarioStartRequest(BaseModel):
    user_id: Optional[str] = None   # legacy field; identity comes from JWT
    workspace_id: str
    topic: Optional[str] = None


class ScenarioRespondRequest(BaseModel):
    user_id: Optional[str] = None   # legacy field; identity comes from JWT
    scenario_id: str
    user_response: str
    turn_history: List[Dict[str, str]] = []
    scenario_context: str = ""




# ── Voice ────────────────────────────────────────────
class VoiceChatMessage(BaseModel):
    user_id: Optional[str] = None   # legacy field; identity comes from JWT
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
