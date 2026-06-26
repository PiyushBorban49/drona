import asyncio
import subprocess
import os
import sys
import traceback
from typing import Optional

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

async def render_scene(python_file_path: str, scene_class_name: str, quality: str = 'l') -> str:
    quality_map = {'l': '480p15', 'm': '720p30', 'h': '1080p60', 'k': '2160p60'}
    # Use backend/media/videos for outputs
    output_dir = os.path.join(BACKEND_ROOT, 'media', 'manim_output')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    script_name = os.path.splitext(os.path.basename(python_file_path))[0]
    resolution = quality_map.get(quality, '480p15')
    print(f"[Renderer] Rendering {scene_class_name} at {resolution}...")
    print(f"[Renderer] Python executable: {sys.executable}")
    print(f"[Renderer] File path: {python_file_path}")
    print(f"[Renderer] File exists: {os.path.exists(python_file_path)}")

    # Use sys.executable to ensure we use the same environment
    command = [
        sys.executable, "-m", "manim", 
        "render",
        f"-q{quality}", 
        python_file_path, 
        scene_class_name, 
        "--media_dir", output_dir
    ]
    print(f"[Renderer] Command: {' '.join(command)}")

    try:
        # Use subprocess.run in a thread to avoid Windows NotImplementedError
        # with asyncio.create_subprocess_exec
        result = await asyncio.to_thread(
            subprocess.run,
            command,
            capture_output=True,
            text=True
        )

        stdout_text = result.stdout.strip()
        stderr_text = result.stderr.strip()

        print(f"[Renderer] Return code: {result.returncode}")
        if stdout_text:
            print(f"[Renderer] STDOUT: {stdout_text[:500]}")
        if stderr_text:
            print(f"[Renderer] STDERR: {stderr_text[:500]}")

        if result.returncode != 0:
            combined_error = f"STDOUT: {stdout_text}\nSTDERR: {stderr_text}"
            raise Exception(combined_error)

        mp4_path = os.path.normpath(os.path.join(output_dir, 'videos', script_name, resolution, f"{scene_class_name}.mp4"))

        print(f"[Renderer] Checking for MP4 at: {mp4_path}")
        if os.path.exists(mp4_path):
            print(f"[Renderer] ✅ Found: {mp4_path}")
        else:
            print(f"[Renderer] ❌ File not found at expected path: {mp4_path}")
            parent_dir = os.path.dirname(mp4_path)
            if os.path.exists(parent_dir):
                 try:
                     print(f"[Renderer] Parent dir contains: {os.listdir(parent_dir)}")
                 except Exception:
                     pass
            else:
                 print(f"[Renderer] Parent dir does NOT exist: {parent_dir}")

        return mp4_path
    except Exception as e:
        print(f"[Renderer] 💥 FULL EXCEPTION in render_scene: {type(e).__name__}: {e}")
        print(f"[Renderer] 💥 Traceback:\n{traceback.format_exc()}")
        raise
