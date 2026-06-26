import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    s = get_settings()
    print(f"Starting Dronacharya at {s.HOST}:{s.PORT}...")
    uvicorn.run("app.main:app", host=s.HOST, port=s.PORT, reload=True, reload_dirs=["app"])
