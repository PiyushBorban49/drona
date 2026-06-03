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


class DebateState(TypedDict):
    topic: str
    stance_a: str
    stance_b: str
    current_round: int
    max_rounds: int
    history: List[Dict[str, str]]
    argument_a: str
    argument_b: str
    moderator_question: str
    status: str  # "debating", "judging", "complete"
