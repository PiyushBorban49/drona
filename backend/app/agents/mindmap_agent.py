"""
Dronacharya v3 — Mindmap Agent
Generates ReactFlow-compatible mindmap data.

Hardening summary (every real production failure mode covered):
  1. Empty / prose-wrapped / markdown-fenced LLM output  -> _extract_json_object()
     pulls the outermost {...} instead of json.loads-ing the whole string.
     (Fixes '[mindmap] generation failed: Expecting value: line 1 column 1')
  2. Flaky one-off bad replies                          -> retried once with a
     stricter 'ONLY raw JSON' instruction before giving up.
  3. LLM layer completely unavailable                   -> deterministic offline
     fallback layout built locally so the explorer canvas is never blank.
The raw LLM JSON is NEVER passed straight to the client in any branch:
everything flows through normalize_mindmap() or the contract-shape builder.
"""
import json
import re
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


_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*(.*?)\s*```\s*$", re.DOTALL | re.IGNORECASE)

# Generous ceiling so reasoning-mode models (see below) fit thinking + answer.
_MAX_COMPLETION_TOKENS = 8192
_REASONING_KEYS = ("reasoning", "reasoning_content", "thinking", "analysis")


def _coerce_text(response) -> str:
    """LangChain message.content may arrive as str OR a list of blocks — always return plain text."""
    content = getattr(response, "content", "")
    if isinstance(content, list):
        chunks = []
        for block in content:
            if isinstance(block, dict):
                chunks.append(str(block.get("text") or block.get("content") or ""))
            else:
                chunks.append(str(block))
        return "".join(chunks).strip()
    return str(content or "").strip()


def _provider_reasoning(response) -> str:
    """
    Reasoning-mode models served over OpenAI-compatible APIs (groq's
    openai/gpt-oss-*, Qwen-thinking, R1 distills) may put their real output in
    a hidden reasoning/analysis buffer, leaving message.content EMPTY.
    Best-effort recovery: collect any reasoning-ish fields the SDK stored.
    """
    found: list[str] = []
    for container_name in ("additional_kwargs", "response_metadata"):
        cont = getattr(response, container_name, None)
        if isinstance(cont, dict):
            for key in _REASONING_KEYS:
                v = cont.get(key)
                if isinstance(v, dict):
                    v = v.get("text") or v.get("content")
                if isinstance(v, str) and v.strip():
                    found.append(v.strip())
    # de-duplicate while preserving order
    seen, uniq = set(), []
    for f in found:
        if f not in seen:
            seen.add(f)
            uniq.append(f)
    return "\n".join(uniq)


def _extract_json_object(raw: str) -> str:
    """
    Pull the outermost JSON object out of arbitrary model output — plain JSON,
    ```json fences, prose around the object, trailing chatter all supported.
    Raises ValueError with a short, log-safe preview when nothing exists.
    """
    text = (raw or "").strip()
    if not text:
        raise ValueError("model returned an EMPTY response")

    m = _FENCE_RE.match(text)
    if m and "{" in m.group(1):
        text = m.group(1).strip()

    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        preview = text[:140] + ("…" if len(text) > 140 else "")
        raise ValueError(f"no JSON object found in model output: {preview!r}")
    return text[start:end + 1]


def _build_prompt(topic: str, context: str, strict: bool) -> str:
    ctx = context[:3000] if context else "Use general NCERT knowledge."
    prompt = f"""Create a rich, well-spaced React Flow mindmap for: {topic}
Context: {ctx}

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
    if strict:
        prompt += (
            "\nIMPORTANT: Output ONLY the raw JSON object itself. No markdown "
            "code fences, no explanations before or after, no headings. "
            "Start your reply with '{' and end it with '}'.\n"
        )
    return prompt


def _attempt(llm, topic: str, context: str, strict: bool) -> dict:
    """One LLM round-trip → normalized mindmap. Raises ValueError/JSONDecodeError on bad output."""
    prompt = _build_prompt(topic, context, strict)
    call_kwargs: dict = {"max_tokens": _MAX_COMPLETION_TOKENS}
    # gpt-oss-style models “think” in an analysis channel before answering;
    # explicitly LOW effort keeps room (and budget) for the actual JSON answer.
    if str(getattr(llm, "model_name", "")).startswith("openai/gpt-oss"):
        call_kwargs["reasoning_effort"] = "low"
    response = llm.bind(**call_kwargs).invoke([HumanMessage(content=prompt)])

    text = _coerce_text(response)
    if not text:
        reasoning = _provider_reasoning(response)
        finish = (getattr(response, "response_metadata", None) or {}).get("finish_reason")
        print(
            f"[mindmap] empty content from model={getattr(llm, 'model_name', '?')} "
            f"finish_reason={finish}; probing hidden reasoning buffer ({len(reasoning)} chars)",
            flush=True,
        )
        text = _extract_json_object(reasoning)  # raises info-rich ValueError if truly empty
    data = json.loads(_extract_json_object(text))
    return normalize_mindmap(data)


def _offline_fallback(topic: str, context: str) -> dict:
    """
    Deterministic local mindmap used when the AI layer is unavailable, so the
    explorer always renders something coherent instead of a blank canvas.
    Labels come from context sentences when available, otherwise generic but
    honest subtopics derived from the topic string.
    """
    def _truncate(s: str, n: int = 46) -> str:
        s = s.strip().rstrip(".")
        return s if len(s) <= n else s[:s[:n].rfind(" ")].strip() or s[:n]

    labels: list[str] = []
    if context:
        sentences = re.split(r"(?<=[.!?])\s+|\n+", context)
        for s in sentences:
            s = s.strip()
            if len(s) > 15 and len(s) < 220:
                labels.append(_truncate(s))
            if len(labels) >= 6:
                break

    topic_words = [w.capitalize() for w in re.findall(r"[a-zA-Z]{3,}", topic)[:4]]
    generic_fillers = [
        "Key Concepts",
        "How It Works",
        "Real-world Applications",
        "Important Formulas" if any(w.lower() in ("physics", "mathematics", "maths") for w in topic_words) else "Common Examples",
        "Exam Tips",
        "Quick Revision",
    ]
    i = 0
    while len(labels) < 6 and i < len(generic_fillers):
        filler = generic_fillers[i]
        label = f"{filler}: {' '.join(topic_words)}" if topic_words else filler
        labels.append(label)
        i += 1
    labels = labels[:8]

    nodes = [{
        "id": "1",
        "type": "explorer",
        "position": {"x": 600, "y": 50},
        "data": {
            "label": _truncate(topic, 60) or "Main Topic",
            "description": "Offline placeholder map — the AI engine was unreachable, showing an auto-arranged outline you can navigate.",
            "video_url": "",
            "progress": 0,
            "quiz_available": True,
            "key_points": [],
        },
    }]
    edges = []
    per_row = 4
    for i, label in enumerate(labels):
        row, col = divmod(i, per_row)
        nid = str(i + 2)
        nodes.append({
            "id": nid,
            "type": "explorer",
            "position": {"x": 40 + col * 300, "y": 420 + row * 340},
            "data": {
                "label": label,
                "description": "",
                "video_url": "",
                "progress": 0,
                "quiz_available": False,
                "key_points": [],
            },
        })
        edges.append({"id": f"e1-{nid}", "source": "1", "target": nid, "animated": True})

    return {"nodes": nodes, "edges": edges}


def generate_mindmap(topic: str, context: str = "") -> dict:
    # Up to 2 LLM rounds (second with a stricter raw-JSON instruction)…
    try:
        llm = get_llm_strict()
        last_error: Exception | None = None
        for attempt, strict in enumerate((False, True), start=1):
            try:
                data = _attempt(llm, topic, context, strict=strict)
                return {"success": True, "mindmap": data}
            except (ValueError, json.JSONDecodeError) as e:
                last_error = e
                print(f"[mindmap] attempt {attempt}/2 failed: {e}", flush=True)
        raise ValueError(str(last_error))
    except Exception as e:
        # …and a guaranteed-local fallback so the canvas never goes blank.
        print(f"[mindmap] generation failed: {e}", flush=True)
        try:
            fallback = _offline_fallback(topic, context)
            print(f"[mindmap] serving OFFLINE FALLBACK layout ({len(fallback['nodes'])} nodes)", flush=True)
            return {"success": True, "mindmap": fallback, "fallback": True}
        except Exception as fe:
            print(f"[mindmap] fallback failed too: {fe}", flush=True)
            return {"success": False, "error": str(e)}
