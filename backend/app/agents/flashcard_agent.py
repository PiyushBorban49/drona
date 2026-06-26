"""
Dronacharya v3 — Flashcard Agent
Generates study flashcards for quick revision.
"""
import json
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_flashcards(topic: str, context: str = "", num_cards: int = 10) -> dict:
    llm = get_llm_strict()
    prompt = f"""Create {num_cards} flashcards for: {topic}
Context: {context}

Return ONLY valid JSON:
{{"topic": "{topic}", "cards": [{{"id": 1, "front": "Question/Term", "back": "Answer/Definition", "difficulty": "medium"}}]}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        return {"success": True, "flashcards": json.loads(content)}
    except Exception as e:
        return {"success": False, "error": str(e)}
