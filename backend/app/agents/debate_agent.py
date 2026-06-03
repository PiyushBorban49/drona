"""
Dronacharya v3 — Debate Agent
Orchestrates multi-agent debates between two AI personas + a moderator.
"""
import json
from langchain_core.messages import SystemMessage, HumanMessage
from app.dependencies import get_llm


def start_debate(
    topic: str, stance_a: str = "", stance_b: str = "", context: str = ""
) -> dict:
    """Initialize a debate on a topic."""
    llm = get_llm()

    # Auto-generate stances if not provided
    if not stance_a or not stance_b:
        setup_prompt = f"""For the topic "{topic}", suggest two opposing debate stances.
Return ONLY JSON: {{"stance_a": "For position...", "stance_b": "Against position..."}}"""
        try:
            resp = llm.invoke([HumanMessage(content=setup_prompt)])
            content = resp.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1].replace("json", "").strip()
            stances = json.loads(content)
            stance_a = stances.get("stance_a", f"In favor of {topic}")
            stance_b = stances.get("stance_b", f"Against {topic}")
        except:
            stance_a = f"In favor of {topic}"
            stance_b = f"Against {topic}"

    return {
        "success": True,
        "debate": {
            "topic": topic,
            "stance_a": stance_a,
            "stance_b": stance_b,
            "rounds": [],
            "status": "ready",
        },
    }


def generate_debate_round(
    topic: str,
    stance_a: str,
    stance_b: str,
    round_num: int,
    history: list = [],
    context: str = "",
) -> dict:
    """Generate one round of debate: Agent A argues, Agent B argues, Moderator asks student."""
    llm = get_llm()

    history_str = ""
    for h in history[-6:]:
        history_str += f"\n{h['speaker']}: {h['content']}"

    # Agent A
    prompt_a = f"""You are Debater A in an academic debate for NCERT students.
Topic: {topic}
Your stance: {stance_a}
Round: {round_num}
Previous arguments:{history_str}

Give a compelling 3-4 sentence argument supporting YOUR stance. Use facts, examples, and logic.
Be persuasive but educational. Reference NCERT concepts where possible."""

    resp_a = llm.invoke([HumanMessage(content=prompt_a)])
    arg_a = resp_a.content.strip()

    # Agent B
    prompt_b = f"""You are Debater B in an academic debate for NCERT students.
Topic: {topic}
Your stance: {stance_b}
Round: {round_num}
Agent A just said: "{arg_a}"
Previous arguments:{history_str}

Counter Agent A's argument with a 3-4 sentence response supporting YOUR stance.
Be persuasive but educational. Reference NCERT concepts where possible."""

    resp_b = llm.invoke([HumanMessage(content=prompt_b)])
    arg_b = resp_b.content.strip()

    # Moderator
    prompt_mod = f"""You are the Moderator in an academic debate for NCERT students.
Topic: {topic}
Round {round_num} just concluded.

Agent A ({stance_a}) said: "{arg_a}"
Agent B ({stance_b}) said: "{arg_b}"

Ask the student ONE thought-provoking question to help them evaluate both arguments.
The question should test their understanding of the NCERT concepts involved.
Keep it under 2 sentences."""

    resp_mod = llm.invoke([HumanMessage(content=prompt_mod)])
    moderator_q = resp_mod.content.strip()

    return {
        "success": True,
        "round": {
            "round_num": round_num,
            "argument_a": arg_a,
            "argument_b": arg_b,
            "moderator_question": moderator_q,
        },
    }


def evaluate_judgment(
    topic: str, argument_a: str, argument_b: str, user_verdict: str
) -> dict:
    """Evaluate the student's judgment of the debate round."""
    llm = get_llm()
    prompt = f"""A student just judged a debate round:
Topic: {topic}
Agent A argued: "{argument_a}"
Agent B argued: "{argument_b}"
Student chose: {"Agent A" if user_verdict == "a" else "Agent B" if user_verdict == "b" else "Draw"}

In 2-3 sentences, tell the student:
1. Whether their choice shows good critical thinking
2. What key NCERT concept they should remember from this exchange
Be encouraging regardless of their choice."""

    try:
        resp = llm.invoke([HumanMessage(content=prompt)])
        return {"success": True, "feedback": resp.content.strip()}
    except Exception as e:
        return {"success": False, "error": str(e)}
