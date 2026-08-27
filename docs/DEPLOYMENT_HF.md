# ☁️ Deployment Guide — Hugging Face Spaces & beyond

Four supported topologies:

| # | Topology | HF compute | Best when |
|---|---|---|---|
| **A** | Backend-only **Gradio SDK Space** ← recommended | **FREE** | Docker Spaces cost money now; you run the UI locally (dev) or host it separately |
| B | Full-stack Docker Space | paid | You have paid compute and want one URL for everything |
| C | Split hosting (Space ⇄ Vercel) | paid / mixed | Independent scaling per tier |
| D | Local full-stack rehearsal | none offline-ish | Pre-flight checks without pushing |

---

## Option A — Backend on a FREE Gradio SDK Space ✅ (recommended)

Hugging Face charges for **Docker** Spaces, but the classic **Gradio SDK tier stays free**. This repo ships a complete free path:

```bash
hf auth login                                      # once — stores push credentials
./scripts/deploy_backend_space.sh <you>/drona-backend
```

The script builds a clean staging tree, **import-checks it before shipping**, then pushes:

| Staged file | Source | Note |
|---|---|---|
| `README.md` | `hf-space-backend/README.md` | Space card (`sdk: gradio`, `app_file: app.py`) |
| `app.py` | `hf-space-backend/app.py` | Runs our FastAPI via uvicorn on port 7860 |
| `requirements.txt` | `backend/requirements.txt` | Superset incl. gradio |
| `backend/app/**` | rsync of the package | `.env`, media, tmp, tests, caches excluded — **no secrets ever leave your machine via this tree** |

### After the first push (~3–6 min build)

1. **Space → Settings → Variables and secrets**:

   🔒 Secrets: `GROQ_API_KEY` · `INSFORGE_URL` · `INSFORGE_API_KEY` (+optionals)

   📣 Variables: `CORS_ORIGINS = ["http://localhost:3000"]` — JSON list of every browser origin that will call this API. Add hosted origins later as you publish them.

2. Visit (host rule: `owner/space_name` → `owner-space-name.hf.space`, underscores become dashes):

   - `https://<you>-drona-backend.hf.space/` → health JSON (`"status": "running"`)
   - `https://<you>-drona-backend.hf.space/app` → 🎓 **Gradio control panel** (model name, key/InsForge status, live `/health` ping)
   - `https://<you>-drona-backend.hf.space/docs` → interactive OpenAPI explorer

3. **Pair the frontend** — `frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL=https://<you>-drona-backend.hf.space
   ```

4. **Re-deploys**: rerun the same script whenever backend code changes (`git pull` first). Boot failures are impossible to debug blindly here — if a secret is wrong the Space serves a red **diagnostic page naming the crash** instead of dying.

### Why state survives on an ephemeral free Space
Everything durable lives in InsForge cloud: Postgres tables, pgvector embeddings, session auth, and the `videos`/`keyframes` buckets (public URLs). The Space itself holds no data worth persisting.

### Free-tier limits to expect (Gradio Spaces)
CPU-basic hardware (2 vCPU), ephemeral disk, auto-sleep after ~48 h inactivity — wake-up takes ≈1 min. Manim video rendering works but is slow on CPU; heavy classroom usage may warrant paid CPU upgrade later.

---

## Option B — Full stack on ONE Hugging Face *Docker* Space 💳 (paid)

One container serves the UI and proxies API calls; the browser never leaves your `*.hf.space` origin.

### What the Dockerfile does

| Step | Detail |
|---|---|
| Base | `manimcommunity/manim` — Python + FFmpeg + LaTeX + Manim preinstalled |
| Runtime | Node 20 for the Next.js build & server |
| Build | `npm ci && npm run build` inside the image (public InsForge values passed as build-args) |
| Ports | backend uvicorn on private `127.0.0.1:8000`; frontend on **`7860`** — the HF Spaces contract port (`PORT`) |
| User | dedicated non-root `appuser` (uid 1000), matching HF runtime constraints |
| Health | HEALTHCHECK polls the FastAPI readiness endpoint until then Space shows *Running* |
| Entrypoint | `start.sh`: boot uvicorn → wait ready → exec `next start -H 0.0.0.0 -p $PORT` |

> Requires paid compute since Hugging Face changed Space pricing — most users should use the free [Option A](#option-a--backend-on-a-free-gradio-sdk-space--recommended) instead. Kept verbatim for teams with paid compute.

### Step-by-step

1. **Create the Space** → SDK: *Docker* → license as you like → empty template.
2. **Settings → Variables and secrets**:

   🔒 Secrets (runtime):
   ```
   GROQ_API_KEY        gsk_…
   INSFORGE_URL        https://<appkey>.us-east.insforge.app
   INSFORGE_API_KEY    ik_…
   # optional: GOOGLE_API_KEY · MUX_TOKEN_ID · MUX_SECRET_KEY · TAVILY_API_KEY
   ```

   📣 Variables (build-time, public by design — they ship into the client bundle):
   ```
   NEXT_PUBLIC_INSFORGE_URL        https://<appkey>.us-east.insforge.app
   NEXT_PUBLIC_INSFORGE_ANON_KEY    anon_…
   ```

3. **Point the Space at this repo** (either connect the GitHub repo directly or add a remote):

   ```bash
   git remote add space https://huggingface.co/spaces/<you>/<space-name>
   git push space main
   ```

4. First build takes ≈8–12 min (Manim base layers). Subsequent pushes are cached except when frontend deps change.
5. **README front-matter matters** on HF: keep the YAML block at the very top of `README.md`
   (`sdk: docker`, `app_port: 7860`). It configures the Space's routing.

### Why no CORS pain

In-container `NEXT_PUBLIC_API_URL` is intentionally unset ⇒ `lib/api.ts` switches to same-origin mode: browser calls `/api/mindmap` etc., and `next.config.ts` rewrites `/api/*`, `/videos/*`, `/keyframes/*` to the loopback uvicorn. One origin, zero exposed admin surface.

### Persistence notes

- Generated videos/keyframes upload to **InsForge storage buckets**, so they survive restarts even without persistent disk.
- Local `backend/media/` files are ephemeral; enable a Persistent Storage add-on only if you rely on local-fallback uploads.
- Ephemeral FS wipes `/tmp` caches (edge-tts, manim) on rebuilds — normal behaviour.

---

## Option C — Split hosting (backend Space ⇄ Vercel frontend)

The original architecture; still fully supported.

1. Deploy **only the backend image** by using the same Dockerfile — nothing breaks if you instead point a Vercel-hosted frontend at it.
2. Frontend on Vercel sets `NEXT_PUBLIC_API_URL=https://<your-backend>.hf.space` ⇒ absolute-mode fetches; backend `CORS_ORIGINS` must include your Vercel domain(s).
3. Build-time args for the public InsForge variables come from Vercel env settings.

Trade-offs vs B: two deploy targets and CORS config in exchange for independent scaling/redeploys.

---

## Option D — Local full-stack rehearsal of the container

You can reproduce the exact Space topology without Docker:

```bash
cd backend  && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
cd frontend && unset NEXT_PUBLIC_API_URL && npx next start -p 7860
# open http://localhost:7860  — requests go through /api rewrites
```

Used to verify commit `15065ac+` before shipping the Dockerfile.

---

## Environment matrix recap

| Where | File/source | Must contain |
|---|---|---|
| Local dev | `backend/.env` | INSFORGE_URL/API_KEY · GROQ_API_KEY · optional keys |
| Local dev | `frontend/.env.local` | NEXT_PUBLIC_INSFORGE_URL/_ANON_KEY · **NEXT_PUBLIC_API_URL=http://localhost:8000** (or the Space URL in Option A/C mode) |
| HF Space (A) | Secrets | GROQ_API_KEY · INSFORGE_URL · INSFORGE_API_KEY (+optionals) |
| HF Space (A) | Variables | CORS_ORIGINS JSON list of browser origins · optional GROQ_MODEL |
| HF Space (B/C) | Secrets | GROQ_API_KEY · INSFORGE_URL · INSFORGE_API_KEY (+optionals) |
| HF Space (B/C) | Variables (build) | NEXT_PUBLIC_INSFORGE_URL/_ANON_KEY — *and NO* NEXT_PUBLIC_API_URL |

⚠️ Precedence warning: pydantic-settings order is **environment variable > .env file > code default**. If a stale `GROQ_MODEL=…` line exists in your `.env`, code defaults silently lose. When debugging model selection, grep your `.env` first.

---

## Cost & tier notes (Groq free tier reality)

- Most models hover around ~6–8k tokens-per-minute on free/on-demand tiers; TPM counts prompt + completion budget together.
- The mindmap agent ships adaptive budgets targeting ≤7500 total per call; video planner calls share the same key so bursty pipelines can still trip limits — upgrade tier (`console.groq.com/settings/billing`) if you plan heavy classroom usage.
