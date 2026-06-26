import asyncio
import base64
import os
import subprocess
import edge_tts
from app.config import get_settings


async def generate_audio_file(text: str, output_path: str) -> float:
    s = get_settings()
    try:
        communicate = edge_tts.Communicate(text, s.EDGE_TTS_VOICE)
        await communicate.save(output_path)

        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            output_path,
        ]
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True
        )
        return float(result.stdout.strip()) if result.stdout.strip() else 0.0

    except Exception as e:
        print(f"--- TTS ERROR: {e} ---")
        return 0.0


async def generate_audio_base64(text: str) -> dict:
    tmp_path = f"/tmp/tts_{hash(text) % 100000}.mp3"
    duration = await generate_audio_file(text, tmp_path)

    audio_b64 = ""
    if os.path.exists(tmp_path):
        with open(tmp_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
        os.remove(tmp_path)

    return {"audio_b64": audio_b64, "duration": duration}
