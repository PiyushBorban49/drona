# ═══════════════════════════════════════════════════════════════════
#  Dronacharya v3 — Hugging Face (Gradio SDK) backend entrypoint
#
#  Why this file exists:
#    Hugging Face *Docker* Spaces now require paid compute, but the
#    classic Gradio SDK remains free. This entrypoint serves the exact
#    same FastAPI backend (backend/app/main.py) through uvicorn on the
#    HF contract port 7860. Wherever `gradio` is installed, main.py
#    additionally mounts a lightweight control panel at /app.
#
#  Expected staged tree (see scripts/deploy_backend_space.sh):
#      ./README.md           ← Space card (sdk: gradio)
#      ./app.py              ← this file
#      ./requirements.txt    ← superset incl. gradio
#      ./backend/app/**      ← the application package
#
#  Run locally:   python app.py            (http://localhost:7860)
# ═══════════════════════════════════════════════════════════════════
import os
import sys
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_SRC = os.path.join(_HERE, "backend")
if _BACKEND_SRC not in sys.path:
    sys.path.insert(0, _BACKEND_SRC)  # make `import app.*` resolve


def _diagnostic_api(detail: str):
    """Last-resort ASGI app: never leave a Space stuck on 'Runtime error'
    without an explanation — tell the operator exactly what crashed."""
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse, JSONResponse

    f = FastAPI(title="Dronacharya Backend — boot failed")
    body = {
        "status": "boot_error",
        "hint": "Open Space logs → Runtime tab. Fix the missing/invalid "
                "secret listed below, then restart/re-push the Space.",
        "detail": detail[-2500:],
    }

    @f.get("/", include_in_schema=False)
    def _r():
        return JSONResponse(body)

    @f.get("/health", tags=["Health"])
    def _h():
        return JSONResponse(body)

    @f.get("/error", response_class=HTMLResponse, include_in_schema=False)
    def _e():
        return (
            "<html><body style='font-family:sans-serif;background:#111;"
            "color:#eee;padding:2rem'><h1>🚨 Dronacharya backend boot error</h1>"
            f"<pre style='white-space:pre-wrap;color:#fa8'>{detail[-3500:]}</pre>"
            "</body></html>"
        )

    return f


_api = None
_boot_error = ""
try:
    from app.main import app as _api  # noqa: N813  (FastAPI instance)
except Exception:
    _boot_error = traceback.format_exc()
    print("═" * 60, flush=True)
    print("[boot] Dronacharya backend FAILED to start:", flush=True)
    print(_boot_error, flush=True)
    print("═" * 60, flush=True)
    _api = None

asgi = _api if _api is not None else _diagnostic_api(_boot_error)

if __name__ == "__main__":
    import uvicorn

    # HF sets neither of these explicitly for Gradio Spaces; honour them anyway.
    port = int(os.environ.get("PORT") or os.environ.get("GRADIO_SERVER_PORT") or 7860)
    print(f"[drona] serving backend on 0.0.0.0:{port}", flush=True)
    uvicorn.run(asgi, host="0.0.0.0", port=port, log_level="info")
