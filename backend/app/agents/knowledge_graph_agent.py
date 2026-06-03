"""
Dronacharya v3 — Knowledge Graph Agent
Generates an interconnected knowledge galaxy for an entire subject.
Nodes represent concepts, edges represent relationships.
Mastery levels are color-coded from SRS data.
"""
import json
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def generate_knowledge_graph(
    class_name: str, subject: str, context: str = "", mastery_data: dict = {}
) -> dict:
    llm = get_llm_strict()
    prompt = f"""You are an NCERT curriculum architect. Create an interconnected KNOWLEDGE GRAPH for:

Class: {class_name}
Subject: {subject}

Context: {context[:3000] if context else "Use your knowledge of NCERT curriculum."}

Create a comprehensive graph with:
- 20-30 concept nodes covering the entire subject
- Each node represents one key concept/topic
- Edges represent relationships (prerequisite, related, leads_to)
- Group nodes by chapter/unit

Return ONLY valid JSON:
{{
  "subject": "{subject}",
  "class_name": "{class_name}",
  "nodes": [
    {{
      "id": "node_1",
      "label": "Concept Name",
      "chapter": 1,
      "category": "fundamentals",
      "description": "Brief description of concept",
      "position": {{"x": 400, "y": 100}}
    }}
  ],
  "edges": [
    {{
      "id": "e1",
      "source": "node_1",
      "target": "node_2",
      "label": "prerequisite",
      "type": "prerequisite"
    }}
  ]
}}

Position guidelines:
- Spread nodes across x: 50-1200, y: 50-800
- Group related concepts closer together
- Place fundamentals on the left, advanced on the right
- Categories: "fundamentals", "core", "application", "advanced"
"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        graph_data = json.loads(content)

        # Enrich nodes with mastery data from SRS
        for node in graph_data.get("nodes", []):
            node_id = node["id"]
            if node_id in mastery_data:
                node["mastery"] = mastery_data[node_id]  # 0-100
            else:
                node["mastery"] = 0  # Not started

            # Assign color based on mastery
            m = node.get("mastery", 0)
            if m >= 80:
                node["color"] = "#10b981"  # Emerald (mastered)
            elif m >= 50:
                node["color"] = "#f59e0b"  # Amber (learning)
            elif m > 0:
                node["color"] = "#ef4444"  # Red (weak)
            else:
                node["color"] = "#6366f1"  # Indigo (not started)

        return {"success": True, "graph": graph_data}

    except Exception as e:
        return {"success": False, "error": str(e)}
