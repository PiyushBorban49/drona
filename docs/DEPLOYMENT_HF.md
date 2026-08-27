# ☁️ Deployment Guide — Hugging Face Spaces & beyond

Three supported topologies. **Option A is the recommended, fully self-contained setup** shipped in this repo.

---

## Option A — Full stack on ONE Hugging Face Space ✅ (recommended)

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

## Option B — Split hosting (backend Space ⇄ Vercel frontend)

The original architecture; still fully supported.

1. Deploy **only the backend image** by using the same Dockerfile — nothing breaks if you instead point a Vercel-hosted frontend at it.
2. Frontend on Vercel sets `NEXT_PUBLIC_API_URL=https://<your-backend>.hf.space` ⇒ absolute-mode fetches; backend `CORS_ORIGINS` must include your Vercel domain(s).
3. Build-time args for the public InsForge variables come from Vercel env settings.

Trade-offs vs A: two deploy targets and CORS config in exchange for independent scaling/redeploys.

---

## Option C — Local full-stack rehearsal of the container

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
| Local dev | `frontend/.env.local` | NEXT_PUBLIC_INSFORGE_URL/_ANON_KEY · **NEXT_PUBLIC_API_URL=http://localhost:8000** |
| HF Space | Secrets | GROQ_API_KEY · INSFORGE_URL · INSFORGE_API_KEY (+optionals) |
| HF Space | Variables (build) | NEXT_PUBLIC_INSFORGE_URL/_ANON_KEY — *and NO* NEXT_PUBLIC_API_URL |

⚠️ Precedence warning: pydantic-settings order is **environment variable > .env file > code default**. If a stale `GROQ_MODEL=…` line exists in your `.env`, code defaults silently lose. When debugging model selection, grep your `.env` first.

---

## Cost & tier notes (Groq free tier reality)

- Most models hover around ~6–8k tokens-per-minute on free/on-demand tiers; TPM counts prompt + completion budget together.
- The mindmap agent ships adaptive budgets targeting ≤7500 total per call; video planner calls share the same key so bursty pipelines can still trip limits — upgrade tier (`console.groq.com/settings/billing`) if you plan heavy classroom usage.
