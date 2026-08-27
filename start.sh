#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Dronacharya v3 — single-container launcher (Hugging Face Spaces)
#
# Hugging Face docker spaces expose exactly ONE port: $PORT (7860).
# This script runs the FastAPI backend on a private loopback port,
# then serves the built Next.js frontend on $PORT. next.config.ts
# rewrites /api/*, /videos/* and /keyframes/* onto the private port,
# so everything leaves the browser same-origin.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

BACKEND_PORT="${BACKEND_INTERNAL_PORT:-8000}"
PUBLIC_PORT="${PORT:-7860}"

echo "[start] ▶ FastAPI   → 127.0.0.1:${BACKEND_PORT}"
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port "${BACKEND_PORT}" &
UVICORN_PID=$!

echo "[start] ⏳ waiting for backend readiness…"
for i in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
        echo "[start] ✔ backend ready after ${i}s"
        break
    fi
    if ! kill -0 "$UVICORN_PID" 2>/dev/null; then
        echo "[start] ✖ uvicorn died during startup" >&2
        exit 1
    fi
    sleep 1
done

echo "[start] ▶ Next.js     → 0.0.0.0:${PUBLIC_PORT}"
cd /app/frontend
exec npx next start -H 0.0.0.0 -p "${PUBLIC_PORT}"
