
# Trigger reload
import uvicorn
import asyncio
import sys
from app.config import get_settings

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    s = get_settings()
    print(f"Starting Dronacharya at {s.HOST}:{s.PORT}...")
    # Only watch the 'app' directory to avoid scanning 'venv' or 'media'
    uvicorn.run("app.main:app", host=s.HOST, port=s.PORT, reload=True, reload_dirs=["app"])
