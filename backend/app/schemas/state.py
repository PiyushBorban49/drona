"""
Dronacharya v3 — LangGraph State Definitions
"""
from typing import TypedDict, Any, Dict, List, Optional


class TutorState(TypedDict):
    user_id: str
    message: str
    class_name: str
    subject: str
    chapter: Optional[int]
    subtopic_id: Optional[str]

    # Internal
    context: str
    chat_history: List[Dict[str, str]]
    next_step: str  # "reply", "quiz", "visualize", "mindmap"

    # Outputs
    response: str
    video_url: Optional[str]
    quiz_json: Optional[Dict[str, Any]]


