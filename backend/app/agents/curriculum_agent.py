"""
Dronacharya v3 — Curriculum Agent
Dynamically generates a hierarchical syllabus (Topics → Subtopics) from a Workspace.
"""
import json
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_workspace_curriculum(workspace_id: str, context: str) -> dict:
    llm = get_llm_strict()
    prompt = f"""You are an expert curriculum designer. Break down the following uploaded document/workspace context into a hierarchical syllabus.

Context from Workspace:
{context[:6000] if context else "No context provided. Generate a generic curriculum."}

Create a syllabus structure with:
- 3-5 main Topics (Core chapters/themes)
- Each Topic has 2-4 Subtopics
- Each Subtopic is a specific concept (2-3 minutes to explain)

Return ONLY valid JSON (no markdown):
{{
    "workspace_id": "{workspace_id}",
    "title": "Generated Curriculum",
    "topics": [
        {{
            "id": "t1",
            "title": "Topic 1 Title",
            "description": "Brief description",
            "subtopics": [
                {{
                    "id": "s1_1",
                    "title": "Subtopic Title",
                    "description": "What this subtopic covers",
                    "key_points": ["Point 1", "Point 2"]
                }}
            ]
        }}
    ]
}}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        curriculum_data = json.loads(content)
        return {"success": True, "curriculum": curriculum_data}
    except Exception as e:
        return {"success": False, "error": str(e)}
