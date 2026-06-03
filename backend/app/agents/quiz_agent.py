import json
from typing import List
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_quiz(topic: str, context: str = "", num_questions: int = 5) -> dict:
    llm = get_llm_strict()
    prompt = f"""Generate a {num_questions}-question MCQ quiz for: {topic}
Context: {context[:3000] if context else "Use general NCERT knowledge."}

Return ONLY valid JSON (no markdown, no explanation):
{{"title": "Quiz: {topic}", "questions": [{{"id": 1, "question_text": "...", "options": ["A", "B", "C", "D"], "correct_option_index": 0, "explanation": "...", "difficulty": "medium"}}]}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        return {"success": True, "quiz": json.loads(content)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def generate_subtopic_quiz(
    subtopic_title: str,
    subtopic_description: str,
    key_points: List[str],
    num_questions: int = 3,
) -> dict:
    llm = get_llm_strict()
    prompt = f"""Create {num_questions} MCQ questions for this subtopic:

Title: {subtopic_title}
Description: {subtopic_description}
Key Points: {', '.join(key_points)}

Return ONLY valid JSON:
{{"questions": [{{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}}]}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        return {"success": True, "quiz": json.loads(content)}
    except Exception as e:
        return {"success": False, "error": str(e)}
