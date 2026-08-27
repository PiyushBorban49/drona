# 🏗 Architecture — Dronacharya v3

This document maps every moving part: how a request travels, who owns identity, where data lives, and how the video engine renders lessons.

---

## 1. High-level topology

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  Next.js 16 (App Router)                                          │
│   ├─ app/dashboard/*        pages (explorer, chat, quiz, …)       │
│   ├─ lib/api.ts             ONE fetchAPI client — adds Bearer     │
│   ├─ lib/insforge.ts        @insforge/sdk singleton               │
│   └─ context/AuthContext    session state + auto re-hydration     │
└───────────────┬───────────────────────────────────────────────────┘
                │  fetch('/api/<endpoint>')          (same-origin mode)
                ▼
┌───────────────────────────── Next server ─────────────────────────┐
│  next.config.ts rewrites:                                         │
│      /api/:path*       → http://127.0.0.1:8000/:path*             │
│      /videos/:path*    → backend static mount                     │
│      /keyframes/:path* → backend static mount                     │
│  (In split-hosting mode NEXT_PUBLIC_API_URL is set instead and    │
│   requests go directly to FastAPI over CORS.)                     │
└───────────────┬───────────────────────────────────────────────────┘
                ▼
┌───────────────────────────── FastAPI ─────────────────────────────┐
│  routers: chat · content · video · curriculum · scenario · user   │
│           ingest                                                  │
│  dependencies.get_current_user ← InsForge token introspection     │
│  agents layer (pure business logic, one file per capability)      │
│  services: insforge_client · vector_store · user_service · tts …  │
└──┬───────────────────────┬──────────────────────────┬─────────────┘
   │                       │                          │
   ▼                       ▼                          ▼
Groq LLMs              InsForge BaaS              Manim+FFmpeg
llama-3.3-70b-        ┌ Postgres ─────────────┐   scene render pipeline
versatile (default)   │ auth.users            │   (see §4)
openai/gpt-oss-*      │ public.user_stats     │
(opt-in reasoning)    │ workspace_embeddings  │
                      │ match_workspace_chunks│
                      │ videos / keyframes    │
                      └ buckets (media) ──────┘
```

---

## 2. Identity & security contract

| Rule | Implementation |
|---|---|
| Identity comes **only** from the Bearer token | `services/auth.py → get_current_user` introspects via InsForge `/api/auth/sessions/current`; body-supplied `user_id` fields are legacy/optional and ignored by routers |
| Introspection results are cached ≤ min(300 s, token exp) | prevents stampede on bursts; tokens themselves expire ~15 min |
| Server failures are explicit | empty env vars raise actionable `InsForgeError` naming the missing variable; never a silent 503 |
| DB access is owner-scoped | `public.user_stats` uses RLS (`owner_id = auth.uid()`); service key used for admin paths |
| Public vs secret keys | browser uses ANON key only; API key lives in backend env/secrets |

**Token lifecycle gotcha:** access tokens die every ≈15 minutes on purpose. The SDK refreshes them invisibly for users — but long-lived script sessions must call a sign-in again.

---

## 3. RAG loop (Smart Ingest → retrieval)

1. **Ingest** (`routers/ingest.py`): YouTube transcripts, PDFs, DOCX/PPTX are extracted to text → chunked.
2. **Embed**: chunks go through InsForge AI gateway (`openai/text-embedding-3-small`, 1536-d) — *no local torch*, keeps images tiny.
3. **Store**: rows land in `public.workspace_embeddings` (pgvector, HNSW index).
4. **Retrieve**: every AI call starts with `match_workspace_chunks(workspace_id, query_embedding, k)` — cosine similarity RPC. Agents prepend top chunks as "Context:" so answers cite your material rather than generic internet text.

When no embeddings exist for a workspace, agents fall back to general NCERT knowledge (log line says so).

---

## 4. Video generation pipeline

```
subtopic {title, description, key_points}
      │
      ▼ planner (LLM) ──► scenes JSON [{scene_num, narration, visual_concept}]
      │
      ▼ generator per scene (LLM)
      │     writes Python Manim code for that scene
      │     primary path: Gemini or Groq (user-configurable model)
      │     fallback path: Groq w/ deployment GROQ_MODEL
      ▼ post_processor
      │     manim render per scene → FFmpeg concat/narration mux
      ▼ upload
            POST multipart → InsForge bucket 'videos' (+ 'keyframes')
            returns canonical public URL stored back into node data
```

The container ships the `manimcommunity/manim` base image precisely because LaTeX/Cairo/FFmpeg are preinstalled there.

---

## 5. Same-origin gateway design decision

Why proxy instead of CORS?

| Concern | Direct URL + CORS | Same-origin rewrite (chosen) |
|---|---|---|
| Public hostname baked at build time | yes (client env) | no |
| CORS configuration surface | live config risk | none — browsers see one origin |
| HF Spaces single-port constraint | needs two Spaces/tunnels | natural fit |
| Local dev parity | keep absolute mode via `NEXT_PUBLIC_API_URL` | identical code path also works |

`frontend/lib/api.ts` implements the switch automatically:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
```

---

## 6. Frontend page ↔ API matrix

| Page | Calls |
|---|---|
| `/dashboard/explorer` | `POST /mindmap` → canvas; node click opens sidebar; `POST /video/generate-subtopic` lazily creates lesson videos |
| `/dashboard/chat` | `POST /chat`, voice via TTS endpoints |
| `/dashboard/quiz` | `POST /quiz`, submit flow updates XP via `POST /user/stats/reward` |
| `/dashboard/flashcards` | `POST /flashcards` |
| `/dashboard/scenario` | `POST /scenario/start`, `/scenario/respond` |
| `/dashboard/video` | curriculum CRUD + render status polling |
| `/dashboard/profile` | `GET /user/stats`, profile save through SDK |
| any activity | heartbeat `POST /user/activity/ping` keeps streak fresh |

---

## 7. Resilience inventory (what can fail, what happens)

| Failure | Guard |
|---|---|
| LLM returns fenced/prose JSON | `_extract_json_object` slices outermost `{…}` |
| Reasoning model hides answer in analysis channel | `_provider_reasoning` probes hidden fields before failing |
| Groq TPM 413 | adaptive completion budget + single half-budget retry |
| Mindmap unusable output twice | deterministic offline map built from context sentences |
| Any render crash inside canvas | class error boundary shows readable panel, not white screen |
| Token expired mid-session | SDK auto-refresh; scripts must re-auth manually |
| Backend unreachable | UI shows explicit "Could not reach the server" panel |
