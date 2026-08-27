#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Dronacharya v3 — deploy the BACKEND to a free Hugging Face Space
#
#  Usage:
#     ./scripts/deploy_backend_space.sh <owner>/<space-name> [--stage-only]
#
#  What it does:
#    1. Builds a clean staging tree (no .env, media, tests or caches):
#         README.md            ← hf-space-backend/README.md (sdk: gradio)
#         app.py               ← hf-space-backend/app.py entrypoint
#         requirements.txt     ← superset (backend deps + gradio)
#         backend/app/**       ← the live application package
#    2. Verifies the staged app imports cleanly (never ship broken code)
#    3. git init + commit + push --force to https://huggingface.co/spaces/<id>
#
#  Auth: uses your stored HF credentials (`hf auth login` creates them).
#  After the push: Settings → Variables and secrets → add
#     Secrets:   GROQ_API_KEY · INSFORGE_URL · INSFORGE_API_KEY
#     Variables: CORS_ORIGINS='["http://localhost:3000", …other origins…]'
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

SPACE_ID="${1:?usage: $0 <owner>/<space-name> [--stage-only]}"
MODE="${2:--push}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_TEMPLATE="$REPO_ROOT/hf-space-backend"
STAGE_DIR="${DRONA_STAGE:-$(mktemp -d "${TMPDIR:-/tmp}/drona-space.XXXXXX")}"

echo "→ staging backend into: $STAGE_DIR"
mkdir -p "$STAGE_DIR/backend"

install -m 0644 "$SRC_TEMPLATE/app.py"      "$STAGE_DIR/app.py"
install -m 0644 "$SRC_TEMPLATE/README.md"   "$STAGE_DIR/README.md"
install -m 0644 "$REPO_ROOT/backend/requirements.txt" "$STAGE_DIR/requirements.txt"

# Guard rails for the space repo itself
printf '.env\n.env.*\n__pycache__/\n*.pyc\n' > "$STAGE_DIR/.gitignore"

# Application package only — never credentials or heavy ephemera
if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
        --exclude '__pycache__/' --exclude '*.pyc' \
        --exclude '.env*' --exclude 'media/' --exclude 'tmp/' \
        --exclude 'tests/' \
        "$REPO_ROOT/backend/app/" "$STAGE_DIR/backend/app/"
else
    echo "⚠ rsync not found — falling back to cp -r (includes caches if present)"
    rm -rf "$STAGE_DIR/backend/app"
    cp -r "$REPO_ROOT/backend/app" "$STAGE_DIR/backend/app"
    rm -rf "$STAGE_DIR/backend/app/__pycache__" \
           "$STAGE_DIR/backend/app/media" "$STAGE_DIR/backend/app/tmp"
fi

echo "→ import sanity check inside staged tree…"
(cd "$STAGE_DIR" && python3 - <<'PY'
import sys
sys.path.insert(0, "backend")
from app.main import app          # noqa: F401 — fail before pushing broken code
print("✓ staged app imports cleanly")
PY
) || { echo "✖ staged import check FAILED — nothing was pushed"; exit 1; }

if [[ "$MODE" == "--stage-only" ]]; then
    echo "→ stage-only mode kept tree at: $STAGE_DIR"
    echo "  boot it manually with:  cd $STAGE_DIR && python3 app.py"
    exit 0
fi

git -C "$STAGE_DIR" init -q -b main
git -C "$STAGE_DIR" add -A
git -C "$STAGE_DIR" commit -qm \
    "drona backend @ $(git -C "$REPO_ROOT" rev-parse --short HEAD) ($(date -u '+%Y-%m-%d %H:%MZ'))"

SPACE_URL="https://huggingface.co/spaces/$SPACE_ID"
SPACE_HOST="$(printf '%s' "$SPACE_ID" | tr '/_' '-')"
git -C "$STAGE_DIR" remote remove space 2>/dev/null || true
git -C "$STAGE_DIR" remote add space "$SPACE_URL"

echo "→ pushing to $SPACE_URL"
git -C "$STAGE_DIR" push --force space main

cat <<EOF

✔ pushed. Finish setup on huggingface.co:
  1. Space → Settings → Variables and secrets → New secret:
       GROQ_API_KEY / INSFORGE_URL / INSFORGE_API_KEY
  2. Variables:
       CORS_ORIGINS = ["http://localhost:3000"]
       (add every origin whose browser will call this API)
  3. Wait for 'Running' (~3–6 min first build), then open
       Control panel : $SPACE_URL/app
       API docs      : https://$SPACE_HOST.hf.space/docs

  Pair your frontend — frontend/.env.local:
       NEXT_PUBLIC_API_URL=https://$SPACE_HOST.hf.space
EOF