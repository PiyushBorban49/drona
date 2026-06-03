"""
Dronacharya v3 — Video Agent (Manim Pipeline Architecture)
Orchestrates educational video generation using the Manim production pipeline.
"""
import os
import re
import glob
import asyncio
import subprocess
import shutil
from app.services.mux_service import upload_to_mux

# Absolute paths — never depend on CWD
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VIDEO_GENERATOR_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, "..", "video-generator"))
DEFAULT_OUTPUT_DIR = os.path.join(_BACKEND_DIR, "media", "videos")

async def generate_subtopic_video(
    subtopic_id: str,
    title: str,
    description: str,
    key_points: list = [],
    output_dir: str = None,
    model: str = None,
    api_key: str = None,
) -> dict:
    """
    Generate a single scene video:
    Calls the Manim node.js pipeline in video-generator/main.js
    """
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR

    # Make output_dir absolute if it isn't already
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(_BACKEND_DIR, output_dir)

    try:
        print(f"--- VIDEO AGENT: Generating AI-Powered Video via Manim for '{title}' ---")
        safe_id = re.sub(r"[^a-zA-Z0-9_]", "_", subtopic_id)
        
        # Build the exact topic prompt sent to the generator
        full_topic = f"{title}. {description}"
        if key_points:
            full_topic += f" Key points: {', '.join(key_points)}"
            
        # CACHE CHECK: If a final video for this topic already exists, serve it immediately
        slug = re.sub(r'[^a-z0-9]+', '_', full_topic.lower())[:60]
        final_mp4_name = f"final_{slug}.mp4"
        
        # Check generator root and output for existing final video
        video_gen_output = os.path.join(VIDEO_GENERATOR_DIR, "output")
        cached_paths = [
            os.path.join(DEFAULT_OUTPUT_DIR, f"scene_{safe_id}.mp4"),
            os.path.join(VIDEO_GENERATOR_DIR, final_mp4_name),
            os.path.join(video_gen_output, final_mp4_name)
        ]
        
        for p in cached_paths:
            if os.path.exists(p):
                print(f"  [Cache] ⚡ Found existing video for topic: {p}")
                target_video_path = os.path.join(DEFAULT_OUTPUT_DIR, f"scene_{safe_id}.mp4")
                if p != target_video_path:
                    os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)
                    shutil.copy2(p, target_video_path)
                return {"success": True, "video_path": target_video_path}

        # Build subprocess env — inject user-supplied model / key if provided
        node_env = os.environ.copy()
        if model:
            node_env["USER_MODEL"] = model
        if api_key:
            node_env["USER_API_KEY"] = api_key

        print(f"  [Pipeline] Triggering node main.js in {VIDEO_GENERATOR_DIR}")
        if model:
            print(f"  [Pipeline] Using model override: {model}")

        # Track specific errors from the output
        captured_errors = []
        
        def run_and_stream():
            import subprocess
            import threading
            
            process = subprocess.Popen(
                ["node", "main.js", full_topic],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=VIDEO_GENERATOR_DIR,
                text=True,
                encoding="utf-8",
                env=node_env,
            )
            
            def stream_output(stream, prefix):
                for line in stream:
                    if line:
                        line_text = line.strip()
                        print(f"  {prefix}: {line_text}")
                        # Look for common failure strings
                        if "Rate limit" in line_text or "429" in line_text:
                            captured_errors.append("API Rate limit hit. Please try again in a few minutes.")
                        elif "Authentication Error" in line_text or "401" in line_text:
                            captured_errors.append("Authentication failure with Video Generator API. Check your keys.")
                        elif "Max API Retries exceeded" in line_text:
                            captured_errors.append("Failed to generate scene logic after multiple attempts (API instability).")
                        elif "insufficient_quota" in line_text:
                            captured_errors.append("API Quota exceeded. Please check your credit balance.")
                        elif "No scenes were successfully rendered" in line_text:
                            captured_errors.append("Rendering failed for all scenes. Check the topic complexity.")
                        
            # Stream stdout and stderr concurrently using threads
            t1 = threading.Thread(target=stream_output, args=(process.stdout, "[Pipeline STDOUT]"))
            t2 = threading.Thread(target=stream_output, args=(process.stderr, "[Pipeline STDERR]"))
            
            t1.start()
            t2.start()
            
            t1.join()
            t2.join()
            
            return process.wait()

        returncode = await asyncio.to_thread(run_and_stream)
        
        if returncode != 0:
            error_msg = captured_errors[0] if captured_errors else f"Internal generation error (Code {returncode})"
            return {"success": False, "error": error_msg}

            
        print("  [Pipeline] Execution completed (checking for output).")
        
        # Shorten slug to avoid Windows MAX_PATH issues (260 chars)
        slug = re.sub(r'[^a-z0-9]+', '_', full_topic.lower())[:60]
        final_mp4_name = f"final_{slug}.mp4"
        
        # Search for the final video in multiple possible locations
        video_gen_output = os.path.join(VIDEO_GENERATOR_DIR, "output")
        search_paths = [
            os.path.join(video_gen_output, final_mp4_name),          # output/final_<slug>.mp4
            os.path.join(VIDEO_GENERATOR_DIR, final_mp4_name),       # video-generator/final_<slug>.mp4
        ]
        
        generated_mp4_path = None
        for p in search_paths:
            print(f"  [Pipeline] Checking: {p} — exists={os.path.exists(p)}")
            if os.path.exists(p):
                generated_mp4_path = p
                break
        
        if not generated_mp4_path:
            print(f"  [Pipeline] ❌ Final video not found for slug: {slug}")
            return {"success": False, "error": f"Video generation failed. Please check the logs for details."}
            
        # Copy to the required output directory
        target_video_path = os.path.join(output_dir, f"scene_{safe_id}.mp4")
        os.makedirs(output_dir, exist_ok=True)
        
        shutil.copy2(generated_mp4_path, target_video_path)
        print(f"  [Pipeline] ✅ Successfully copied video to: {target_video_path}")
        
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


