---
title: Dronacharya Backend
emoji: 🎓
colorFrom: indigo
colorTo: blue
sdk: gradio
sdk_version: 6.3.0
app_file: app.py
pinned: false
---

# 🎓 Dronacharya v3 — Backend API (free Gradio Space)

The **FastAPI brain** of [Dronacharya](https://github.com/PiyushBorban49/drona) — AI NCERT Tutor — deployed on Hugging Face using the **free Gradio SDK** (no Docker compute required).

A small Gradio control panel is auto-mounted at [`/app`](./app) alongside every API route; the full interactive OpenAPI explorer lives at [`/docs`](./docs).

| Route group | Purpose |
|---|---|
| `/chat` | RAG-grounded voice-enabled AI tutor |
| `/mindmap` *(via content)* | Knowledge-Galaxy ReactFlow maps |
| `/quiz` · `/flashcards` · `/scenario` | Drills, SRS Boss Fights, viva roleplay |
| `/video` | Manim lesson generation pipeline |
| `/user` | XP / levels / streaks / study time |
| `/ingest` | YouTube·PDF·doc → pgvector embeddings |

**State lives in InsForge cloud** (Postgres+pgvector, Auth, storage buckets) — nothing persistent is needed on this ephemeral Space.

## 🔧 Required setup (Space → Settings)

🔒 Secrets:
```
GROQ_API_KEY       gsk_…
INSFORGE_URL       https://<appkey>.us-east.insforge.app
INSFORGE_API_KEY   ik_…
```
📣 Variables:
```
CORS_ORIGINS       ["http://localhost:3000"]      ← add any other allowed frontend origin
GROQ_MODEL         llama-3.3-70b-versatile        (optional override)
```

Pair a frontend with this Space: set `NEXT_PUBLIC_API_URL=https://<this-space>.hf.space` in `frontend/.env.local` (dev) — deployment walkthroughs: repo docs → `docs/DEPLOYMENT_HF.md`, Option A.
