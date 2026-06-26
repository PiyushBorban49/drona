"""
Dronacharya v3 — Video Agent (Manim Pipeline Architecture)
Orchestrates educational video generation using the Manim production pipeline.
"""
import os
import re
import asyncio
from app.services.mux_service import upload_to_mux
from app.video_generator import run_video_pipeline

# Absolute paths — never depend on CWD
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_OUTPUT_DIR = os.path.join(_BACKEND_DIR, "media", "videos")

async def generate_subtopic_video(
    subtopic_id: str,
    title: str,
    description: str,
    key_points: list = [],
    output_dir: str = None,
    model: str = None,
    api_key: str = None,
    on_progress=None,
) -> dict:

    """
    Generate a Kurzgesagt-style educational video:
    Calls the native Python pipeline in app.video_generator
    """
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR

    # Make output_dir absolute if it isn't already
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(_BACKEND_DIR, output_dir)

    try:
        print(f"--- VIDEO AGENT: Generating AI-Powered Video via Manim for '{title}' ---")
        safe_id = re.sub(r"[^a-zA-Z0-9_]", "_", subtopic_id)
        
        # Build the exact topic prompt
        full_topic = f"{title}. {description}"
        if key_points:
            full_topic += f" Key points: {', '.join(key_points)}"
            
        # CACHE CHECK: If a final video for this topic already exists, serve it immediately
        slug = re.sub(r'[^a-z0-9]+', '_', full_topic.lower())[:60]
        final_mp4_name = f"final_{slug}.mp4"
        
        cached_path = os.path.join(DEFAULT_OUTPUT_DIR, f"scene_{safe_id}.mp4")
        if os.path.exists(cached_path):
            print(f"  [Cache] ⚡ Found existing video for topic: {cached_path}")
            return {"success": True, "video_path": cached_path}

        # Native Python Pipeline Call
        print(f"  [Pipeline] Triggering run_video_pipeline for: {full_topic}")
        result = await run_video_pipeline(full_topic, model=model, api_key=api_key, on_progress=on_progress)
        
        if not result.get("success"):
            return result

        generated_mp4_path = result["video_path"]
        
        # Move/Rename to the required output path if different
        target_video_path = os.path.join(output_dir, f"scene_{safe_id}.mp4")
        os.makedirs(output_dir, exist_ok=True)
        
        if generated_mp4_path != target_video_path:
            import shutil
            shutil.copy2(generated_mp4_path, target_video_path)
            # Optional: remove the temp one if it's in a temp dir
            # os.remove(generated_mp4_path) 
            
        print(f"  [Pipeline] ✅ Successfully saved video to: {target_video_path}")
        
        # --- MUX UPLOAD ---
        print(f"  [Mux] Starting upload for: {target_video_path}")
        mux_result = upload_to_mux(target_video_path)
        
        return {
            "success": True, 
            "video_path": target_video_path,
            "mux": mux_result if mux_result.get("success") else None
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}



