"""
Dronacharya v3 — Scenario Agent (Boss Fight)
Creates immersive roleplay scenarios for active learning.
The AI becomes a character, and the student must use knowledge to navigate.
"""
import json
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.dependencies import get_llm


def create_scenario(
    class_name: str,
    subject: str,
    chapter: int,
    topic: str = "",
    context: str = "",
) -> dict:
    llm = get_llm()

    prompt = f"""Create an immersive roleplay scenario for NCERT students:

Class: {class_name}, Subject: {subject}, Chapter: {chapter}
Topic: {topic if topic else "General chapter content"}
Context: {context[:2000] if context else "Use NCERT knowledge."}

The scenario should:
1. Place the student in a historical event, scientific situation, or real-world problem
2. The student must USE their knowledge to succeed
3. Include a clear objective and 3-4 turns of interaction
4. Be engaging and dramatic

Return ONLY valid JSON:
{{
    "scenario_id": "sc_{chapter}_1",
    "title": "Dramatic Scenario Title",
    "setting": "Where and when this takes place",
    "character": "Who the AI is playing (e.g., 'A peasant in 1789 France')",
    "student_role": "Who the student is (e.g., 'A young advisor to the king')",
    "objective": "What the student must accomplish using their knowledge",
    "opening_narrative": "2-3 dramatic sentences setting the scene and the character's first dialogue",
    "max_turns": 4,
    "topics_tested": ["Concept 1", "Concept 2"],
    "difficulty": "medium"
}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        scenario = json.loads(content)
        return {"success": True, "scenario": scenario}
    except Exception as e:
        return {"success": False, "error": str(e)}


def respond_in_scenario(
    scenario_context: str,
    character: str,
    student_role: str,
    objective: str,
    user_response: str,
    turn_history: list = [],
    topics_tested: list = [],
) -> dict:
    llm = get_llm()

    history_str = ""
    for h in turn_history[-6:]:
        history_str += f"\n{h['role'].upper()}: {h['content']}"

    system = f"""You are playing a character in an educational roleplay:

CHARACTER: {character}
SCENARIO: {scenario_context}
STUDENT'S ROLE: {student_role}
OBJECTIVE: {objective}

RULES:
1. Stay in character at ALL times
2. React realistically to what the student says
3. If the student uses correct NCERT knowledge, acknowledge it dramatically
4. If the student says something factually wrong, challenge them in-character
5. After each response, secretly evaluate their knowledge (but don't break character)

Topics being tested: {', '.join(topics_tested)}

Previous conversation:{history_str}"""

    eval_instruction = """

After your in-character response, add a JSON block on a new line starting with |||EVAL|||:
|||EVAL|||{"accuracy_score": 0-10, "concepts_demonstrated": ["..."], "feedback": "brief teacher note"}"""

    messages = [
        SystemMessage(content=system + eval_instruction),
        HumanMessage(content=user_response),
    ]

    try:
        response = llm.invoke(messages)
        full_content = response.content.strip()

        character_response = full_content
        evaluation = {"accuracy_score": 5, "concepts_demonstrated": [], "feedback": ""}

        if "|||EVAL|||" in full_content:
            parts = full_content.split("|||EVAL|||")
            character_response = parts[0].strip()
            try:
                evaluation = json.loads(parts[1].strip())
            except:
                pass

        return {
            "success": True,
            "character_response": character_response,
            "evaluation": evaluation,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
