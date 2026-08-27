"""
Dronacharya v3 — Mindmap Agent
Generates ReactFlow-compatible mindmap data.

The raw LLM JSON is NEVER passed straight to the client: every response goes
through normalize_mindmap(), which guarantees the exact contract the explorer
page expects (valid ids, string labels, numeric positions, edges that only
reference existing nodes). A malformed LLM answer therefore degrades into a
clean success/empty graph instead of white-screening the frontend.
"""
import json
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict


def _as_number(v, default: float) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def normalize_mindmap(data) -> dict:
    """
    Enforce the {nodes, edges} ReactFlow contract on arbitrary LLM output.
    Raises ValueError when no usable node list can be recovered.
    """
    if not isinstance(data, dict):
        raise ValueError("LLM output is not a JSON object")

    raw_nodes = data.get("nodes")
    if not isinstance(raw_nodes, list) or not raw_nodes:
        # Some models nest under "mindmap" — try one level of recovery.
        inner = data.get("mindmap")
        if isinstance(inner, dict) and isinstance(inner.get("nodes"), list) and inner["nodes"]:
            raw_nodes = inner["nodes"]
        else:
            raise ValueError("LLM output has no 'nodes' array")

    used_ids: set[str] = set()
    nodes_out: list[dict] = []
    row_y = 0.0
    for i, raw in enumerate(raw_nodes):
        if not isinstance(raw, dict):
            continue
        # id: reuse, or derive from label, guaranteeing uniqueness
        nid = str(raw.get("id") or f"n{i + 1}").strip() or f"n{i + 1}"
        base_id, suffix = nid, 2
        while nid in used_ids:
            nid = f"{base_id}_{suffix}"
            suffix += 1
        used_ids.add(nid)

        raw_data = raw.get("data") if isinstance(raw.get("data"), dict) else {}
        label = str(raw_data.get("label") if raw_data.get("label") is not None else raw.get("label") or "Subtopic")
        description = str(raw_data.get("description") or "")[:400]

        pos = raw.get("position") if isinstance(raw.get("position"), dict) else {}
        x = _as_number(pos.get("x"), 150.0 * ((i % 5) - 2))
        y = _as_number(pos.get("y"), 120.0 * (i // 5))
        row_y = max(row_y, y)

        key_points = raw_data.get("key_points")
        if not isinstance(key_points, list):
            key_points = []

        nodes_out.append({
            "id": nid,
            "type": "explorer",          # the only custom type registered client-side
            "position": {"x": round(x), "y": round(y)},
            "data": {
                "label": label,
                "description": description,
                "video_url": str(raw_data.get("video_url") or ""),
                "progress": _as_number(raw_data.get("progress"), 0),
                "quiz_available": bool(raw_data.get("quiz_available")),
                "key_points": [str(k) for k in key_points],
            },
        })

    if not nodes_out:
        raise ValueError("no parseable nodes in LLM output")

    valid_ids = used_ids
    edges_out: list[dict] = []
    for i, e in enumerate(data.get("edges") or []):
        if not isinstance(e, dict):
            continue
        src, tgt = str(e.get("source") or ""), str(e.get("target") or "")
        if src == tgt or src not in valid_ids or tgt not in valid_ids:
            continue                      # dangling edge → ReactFlow warning soup; drop
        edges_out.append({
            "id": str(e.get("id") or f"e{src}-{tgt}-{i}"),
            "source": src,
            "target": tgt,
            "animated": bool(e.get("animated", True)),
        })

    return {"nodes": nodes_out, "edges": edges_out}


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
        "quiz_available": true,
        "key_points": []
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
            parts = content.split("```")
            content = parts[1].replace("json", "").strip() if len(parts) > 1 else content

        data = normalize_mindmap(json.loads(content))
        return {"success": True, "mindmap": data}
    except Exception as e:
        print(f"[mindmap] generation failed: {e}", flush=True)
        return {"success": False, "error": str(e)}
