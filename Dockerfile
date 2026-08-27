# ═══════════════════════════════════════════════════════════════════
#  Dronacharya v3 — full-stack image for Hugging Face Spaces
#
#  One container, one port:
#    • Next.js frontend (built at image-build time)  → 0.0.0.0:${PORT:-7860}
#    • FastAPI backend (uvicorn, private loopback)   → 127.0.0.1:8000
#    • /api/* · /videos/* · /keyframes/* proxied by next.config.ts rewrites
#
#  Base image: manimcommunity/manim ships Python + FFmpeg + LaTeX + Manim,
#  everything the explainer-video engine needs out of the box.
#
#  Build-time args (bake into client bundle — they are PUBLIC by design):
#      NEXT_PUBLIC_INSFORGE_URL      https://<appkey>.us-east.insforge.app
#      NEXT_PUBLIC_INSFORGE_ANON_KEY anon_…
#  Runtime secrets (set in Space → Settings → Variables and secrets):
#      GROQ_API_KEY · INSFORGE_URL · INSFORGE_API_KEY [+ optional MUX/GOOGLE/TAVILY]
# ═══════════════════════════════════════════════════════════════════
FROM manimcommunity/manim:latest

USER root

# ── Node.js 20 for Next.js build + runtime ──────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates build-essential procps \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Backend Python deps (cached layer) ──────────────────────────────
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# ── Frontend deps (cached layer) ────────────────────────────────────
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci --no-audit --no-fund

# ── Public, browser-safe build-time env (NOT secrets) ───────────────
ARG NEXT_PUBLIC_INSFORGE_URL=""
ARG NEXT_PUBLIC_INSFORGE_ANON_KEY=""
ENV NEXT_PUBLIC_INSFORGE_URL=$NEXT_PUBLIC_INSFORGE_URL \
    NEXT_PUBLIC_INSFORGE_ANON_KEY=$NEXT_PUBLIC_INSFORGE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

COPY frontend ./frontend
RUN cd frontend && npm run build

# ── Backend sources & writable media dirs ───────────────────────────
COPY backend ./backend
RUN mkdir -p backend/media/videos backend/media/keyframes backend/media/audio

# ── Launcher ────────────────────────────────────────────────────────
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Hugging Face runs containers as a non-root user (uid 1000) in Spaces.
# Create it explicitly so both local testing and the Space behave alike.
RUN useradd -m -u 1000 appuser \
    && mkdir -p /home/appuser/.cache \
    && chown -R appuser:appuser /app /home/appuser

USER appuser

ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    BACKEND_INTERNAL_PORT=8000 \
    HOME=/home/appuser

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${BACKEND_INTERNAL_PORT}/ >/dev/null || exit 1

CMD ["/bin/bash", "/app/start.sh"]
