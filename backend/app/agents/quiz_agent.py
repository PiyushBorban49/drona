import json
from typing import List
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_quiz(topic: str, context: any = "", num_questions: int = 5) -> dict:
    """
    Generate an MCQ quiz for a given topic and context.
    Context can be a string (raw text) or a list of key points.
    """
    llm = get_llm_strict()
    
    # Handle structured context
    if isinstance(context, list):
        context_str = f"Key Points: {', '.join(context)}"
    else:
        context_str = f"Context: {context if context else 'Use general NCERT knowledge.'}"

    prompt = f"""Generate a {num_questions}-question MCQ quiz for: {topic}
{context_str}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "title": "Quiz: {topic}",
  "questions": [
    {{
      "id": 1,
      "question_text": "...",
      "options": ["A", "B", "C", "D"],
      "correct_option_index": 0,
      "explanation": "...",
      "hint": "...",
      "difficulty": "medium"
    }}
  ]
}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        
        quiz_data = json.loads(content)
        return {"success": True, "quiz": quiz_data}
    except Exception as e:
        print(f"Quiz generation error: {e}")
        return {"success": False, "error": str(e)}
