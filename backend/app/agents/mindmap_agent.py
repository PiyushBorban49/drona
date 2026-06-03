"""
Dronacharya v3 — Mindmap Agent
Generates ReactFlow-compatible mindmap data.
"""
import json
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_mindmap(topic: str, context: str = "") -> dict:
    llm = get_llm_strict()
    prompt = f"""Create a rich, well-spaced React Flow mindmap for: {topic}
Context: {context[:3000] if context else "Use general NCERT knowledge."}

The mindmap should be structured for an educational explorer.
Return ONLY valid JSON:
{{
  "nodes": [
    {{
      "id": "1",
      "data": {{
        "label": "Main Topic",
        "description": "Full overview of this subject.",
        "video_url": "",
        "progress": 0,
        "quiz_available": true
      }},
      "position": {{"x": 600, "y": 50}},
      "type": "explorer"
    }}
  ],
  "edges": [
    {{"id": "e1-2", "source": "1", "target": "2", "animated": true}}
  ]
}}

### LAYOUT RULES:
1. Create 12-18 nodes spread out significantly (x: 0-1200, y: 0-1000).
2. The central topic node MUST be at (600, 50).
3. Subtopics should radiate outwards or downwards.
4. NO TWO NODES SHOULD BE WITHIN 250 UNITS OF EACH OTHER.
5. All nodes must be type "explorer".
"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].replace("json", "").strip()
        
        # Parse and ensure structure
        data = json.loads(content)
        return {"success": True, "mindmap": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
