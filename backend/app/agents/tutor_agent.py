"""
Dronacharya v3 — Tutor Agent
Core chat agent for per-subtopic tutoring with Socratic questioning.
"""
import json
from typing import List, Dict
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.dependencies import get_llm


def subtopic_chat(
    subtopic_title: str,
    subtopic_description: str,
    key_points: List[str],
    user_message: str,
    chat_history: List[Dict[str, str]] = [],
    context: str = "",
    socratic_mode: bool = False,
    extract_mastery: bool = False,
) -> dict:
    llm = get_llm()
    key_points_str = "\n".join([f"- {p}" for p in key_points])

    # --- Socratic Logic Adjustment ---
    teaching_style = "LEGACY (Informative)"
    socratic_instruction = ""
    if socratic_mode:
        teaching_style = "SOCRATIC (Inquisitive)"
        socratic_instruction = """
YOUR TEACHING STYLE (Socratic Method):
1. Stay focused on THIS subtopic only
2. After explaining a concept, ALWAYS ask the student a thought-provoking question
3. Use real-world analogies and examples from Indian daily life
4. If student answers correctly, praise them and move deeper
5. If student struggles, break it down further — never give up
6. Use emojis sparingly for engagement (🎯 ✅ 💡)
"""
    else:
        socratic_instruction = """
YOUR TEACHING STYLE (Direct & Clear):
1. Be a helpful, encouraging mentor.
2. Explain concepts clearly using Indian analogies.
3. Keep it informative but concise.
"""

    system_prompt = f"""You are Dronacharya — a legendary, wise NCERT tutor.
You are currently teaching: **{subtopic_title}**
{subtopic_description}

Key Points:
{key_points_str}

Additional Context:
{context[:1500] if context else "Use your knowledge."}

Style: {teaching_style}
{socratic_instruction}
"""

    messages = [SystemMessage(content=system_prompt)]
    for msg in chat_history[-10:]:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=user_message))

    try:
        response = llm.invoke(messages)
        content = response.content.strip()

        # Detect suggested actions
        suggested_actions = []
        for token, action in [("[QUIZ]", "quiz"), ("[VIDEO]", "video"), ("[NEXT]", "next_subtopic")]:
            if token in content:
                content = content.replace(token, "")
                suggested_actions.append(action)
        content = content.strip()

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
            "suggested_actions": suggested_actions,
            "mastery_data": mastery_data
        }
    except Exception as e:
        return {
            "response": f"I'm having trouble responding. Error: {str(e)}",
            "chat_history": chat_history,
            "suggested_actions": [],
        }


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
