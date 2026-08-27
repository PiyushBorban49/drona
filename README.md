---
title: Dronacharya API
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# 🎓 Dronacharya v3 — AI Tutor & Video Generator

This is the backend and video generation engine for Dronacharya v3.

## Deployment Details

- **Backend**: Hosted on Hugging Face Spaces (Docker SDK)
- **Video Engine**: Manim + FFmpeg (inside Docker)
- **Frontend**: Hosted on Vercel

## Configuration

Make sure to set the following Environment Variables in your Hugging Face Space settings:

- `GROQ_API_KEY`
- `INSFORGE_URL`
- `INSFORGE_API_KEY`
- `MUX_TOKEN_ID`
- `MUX_SECRET_KEY`
- `GOOGLE_API_KEY`
- `PLANNER_MODEL`
- `CODER_MODEL`

## InsForge Backend

This project runs on [InsForge](https://insforge.dev) for auth, Postgres (pgvector), and storage:

- **Auth**: InsForge Auth issues user access tokens; identity-bearing endpoints (`/user/*`) require `Authorization: Bearer <accessToken>`.
- **Database**: `public.user_stats` (XP/streak/hours/continue-learning) + `public.workspace_embeddings` (RAG vectors via pgvector). Embeddings come from the InsForge AI gateway (`openai/text-embedding-3-small`). Schema lives in `migrations/`.
- **Storage**: buckets `videos` and `keyframes` store generated media with public URLs.
- **CLI**: use `npx @insforge/cli` (`db`, `storage`, `functions`, ...) against the linked project (see `.insforge/project.json`).

For deployment instructions, see [deployment_guide.md](./deployment_guide.md).
