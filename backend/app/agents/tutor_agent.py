"""
Dronacharya v3 — Tutor Agent
Core chat agent for per-subtopic tutoring with Socratic questioning.
"""
import json
from typing import List, Dict
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.dependencies import get_llm


def general_chat(
    topic: str,
    user_message: str,
    chat_history: List[Dict[str, str]] = [],
    context: str = "",
    socratic_mode: bool = False,
    extract_mastery: bool = False
) -> dict:
    llm = get_llm()
    system = f"""You are Dronacharya — a legendary, wise NCERT tutor for {topic}.
{"Use the Socratic method: lead with questions and analogies." if socratic_mode else "Be direct, informative and encouraging."}
If the student asks for quiz, include [QUIZ]. If mindmap, include [MINDMAP].
If flashcards, include [FLASHCARDS]. If video/animation, include [VIDEO].
Context: {context[:2000] if context else "General knowledge."}"""

    messages = [SystemMessage(content=system)]
    for msg in chat_history[-10:]:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=user_message))

    try:
        response = llm.invoke(messages)
        content = response.content
        next_step = "reply"
        for token, step in [("[QUIZ]", "quiz"), ("[MINDMAP]", "mindmap"),
                             ("[FLASHCARDS]", "flashcards"), ("[VIDEO]", "video")]:
            if token in content:
                content = content.replace(token, "").strip()
                next_step = step
                break

        new_history = chat_history + [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": content},
        ]
        
        mastery_data = None
        if extract_mastery:
            mastery_data = extract_mastery_data(content, context)

        return {
            "response": content, 
            "chat_history": new_history, 
            "next_step": next_step,
            "mastery_data": mastery_data
        }
    except Exception as e:
        return {"response": f"Error: {str(e)}", "chat_history": chat_history, "next_step": "reply"}


def extract_mastery_data(response: str, context: str) -> dict:
    """Extracts key terms and formulas from the tutor's response for the 'Smart Aids' panel."""
    llm = get_llm()
    prompt = f"""Extract 2-3 key technical terms (Glossary) and any mathematical formulas mentioned in this text:
---
{response}
---
Context info: {context[:500]}
---
Return ONLY valid JSON:
{{"glossary": [{{"term": "...", "definition": "..."}}], "formulas": [{{"name": "...", "formula": "..."}}]}}"""
    
    try:
        res = llm.invoke([HumanMessage(content=prompt)])
        data = res.content.strip()
        if data.startswith("```"):
            data = data.split("```")[1].replace("json", "").strip()
        return json.loads(data)
    except:
        return {"glossary": [], "formulas": []}
