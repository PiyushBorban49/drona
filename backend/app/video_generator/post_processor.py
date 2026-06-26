import os
import subprocess
import asyncio
import uuid
import json
from typing import List


BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


async def get_media_duration(file_path: str) -> float:
    """Get duration of a media file in seconds using ffprobe."""
    command = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        file_path
    ]
    result = await asyncio.to_thread(
        subprocess.run, command, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[Post-Processor] ffprobe error for {file_path}: {result.stderr[:300]}")
        return 0.0

    try:
        info = json.loads(result.stdout)
        return float(info["format"]["duration"])
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[Post-Processor] Could not parse duration for {file_path}: {e}")
        return 0.0


async def mux_scene_video_audio(video_path: str, audio_path: str, output_path: str) -> str:
    """Mux a single scene's video with its audio, adjusting video length to match audio.

    If the audio is longer than the video, the last frame of the video is frozen
    (via -shortest removed + tpad filter) so the visuals hold while narration finishes.
    If the video is longer, it is trimmed to the audio length.
    """
    audio_dur = await get_media_duration(audio_path)
    video_dur = await get_media_duration(video_path)

    print(f"[Post-Processor] Scene mux: video={video_dur:.2f}s, audio={audio_dur:.2f}s")

    if audio_dur <= 0:
        # No valid audio — just copy the video as-is
        print("[Post-Processor] No valid audio duration, copying video unchanged.")
        command = ["ffmpeg", "-y", "-i", video_path, "-c", "copy", output_path]
    elif audio_dur > video_dur and video_dur > 0:
        # Audio is longer → freeze last frame of video to match audio length
        # tpad=stop_mode=clone pads the video by cloning the last frame
        pad_duration = audio_dur - video_dur
        print(f"[Post-Processor] Padding video with {pad_duration:.2f}s freeze-frame")
        command = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-vf", f"tpad=stop_mode=clone:stop_duration={pad_duration:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-map", "0:v:0", "-map", "1:a:0",
            "-shortest",
            output_path
        ]
    else:
        # Video is longer or same → trim video to audio length
        print(f"[Post-Processor] Trimming video to audio duration ({audio_dur:.2f}s)")
        command = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", f"{audio_dur:.3f}",
            output_path
        ]

    print(f"[Post-Processor] Mux command: {' '.join(command)}")
    result = await asyncio.to_thread(
        subprocess.run, command, capture_output=True, text=True
    )

    if result.returncode != 0:
        error = f"STDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        print(f"[Post-Processor] Scene Mux Error:\n{error[:500]}")
        raise Exception(error)

    print(f"[Post-Processor] ✅ Scene muxed: {output_path}")
    return output_path


async def concatenate_videos(video_files: List[str], output_file_name: str) -> str:
    """Concatenate multiple video files into one using ffmpeg concat demuxer.
    
    Re-encodes to ensure consistent codec/resolution across all scene clips.
    """
    temp_id = uuid.uuid4().hex[:8]
    list_file_path = os.path.join(BACKEND_ROOT, 'tmp', f'temp_video_list_{temp_id}.txt')
    if not os.path.exists(os.path.dirname(list_file_path)):
        os.makedirs(os.path.dirname(list_file_path))
    
    list_content = "\n".join([f"file '{file.replace(chr(92), '/')}'" for file in video_files])
    
    with open(list_file_path, 'w', encoding='utf-8') as f:
        f.write(list_content)
        
    output_dir = os.path.join(BACKEND_ROOT, 'media', 'videos')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    final_output_path = os.path.join(output_dir, output_file_name)
    
    command = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file_path, "-c", "copy", final_output_path]
    
    print(f"[Post-Processor] Concatenating {len(video_files)} videos into {final_output_path}...")
    
    result = await asyncio.to_thread(
        subprocess.run, command, capture_output=True, text=True
    )
    
    stdout_text = result.stdout.strip()
    stderr_text = result.stderr.strip()
    
    if result.returncode != 0:
        combined_error = f"STDOUT: {stdout_text}\nSTDERR: {stderr_text}"
        print(f'[Post-Processor] Video Concatenation Error:\n{combined_error}')
        if os.path.exists(list_file_path):
            os.remove(list_file_path)
        raise Exception(combined_error)
        
    print(f"[Post-Processor] Successfully created final video: {final_output_path}")
    
    if os.path.exists(list_file_path):
        os.remove(list_file_path)
        
    return final_output_path
