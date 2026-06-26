import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(backend_dir)

from app.video_generator.orchestrator import run_video_pipeline

async def main():
    topic = "The concept of Gravity"
    print(f"Testing video pipeline with topic: {topic}")
    
    # We use a mock on_progress to see events
    async def on_progress(event):
        print(f"[Progress] {event}")

    result = await run_video_pipeline(topic, on_progress=on_progress)
    
    print("\n--- TEST RESULT ---")
    if result.get("success"):
        print(f"✅ Success! Video Path: {result.get('video_path')}")
    else:
        print(f"❌ Failed: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(main())
