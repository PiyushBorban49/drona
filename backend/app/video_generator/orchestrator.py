import os
import asyncio
import re
import uuid
import shutil
from typing import List, Dict, Any, Optional

from app.video_generator.planner import plan_scenes
from app.video_generator.generator import generate_manim_code, generate_batch_manim_code
from app.video_generator.validator import validate_manim_code
from app.video_generator.renderer import render_scene
from app.video_generator.post_processor import concatenate_videos, mux_scene_video_audio
from app.video_generator.tts import generate_tts

MAX_RETRIES = 3 # Number of times to retry rendering a scene



async def run_video_pipeline(topic: str, model: str = None, api_key: str = None, on_progress=None) -> Dict[str, Any]:
    """Main entry point for backend video generation with sequential stages."""
    print(f"--- Starting Video Pipeline for: {topic} ---")
    
    try:
        # --- STAGE 1: PLANNING ---
        if on_progress:
            await on_progress({"type": "status", "message": "Planning scenes..."})
        scene_plan = await plan_scenes(topic, api_key)
        scenes = scene_plan.get('scenes', scene_plan) if isinstance(scene_plan, dict) else scene_plan
        
        if on_progress:
            await on_progress({"type": "scenes_planned", "count": len(scenes)})

        generator_config = {"apiKey": api_key or os.getenv('GOOGLE_API_KEY'), "model": model}
        
        # --- STAGE 2: BATCH GENERATION ---
        if on_progress:
            await on_progress({"type": "status", "message": f"Generating code for {len(scenes)} scenes..."})
        
        all_scene_files = {}
        BATCH_SIZE = 5 
        for i in range(0, len(scenes), BATCH_SIZE):
            batch = scenes[i : i + BATCH_SIZE]
            print(f"[Pipeline] 📦 Generating batch {i//BATCH_SIZE + 1}...")
            batch_results, error_msg = await generate_batch_manim_code(batch, generator_config)
            
            if error_msg:
                 print(f"[Pipeline] 🛑 Batch generation error: {error_msg}")
                 return {"success": False, "error": error_msg}
            else:
                all_scene_files.update(batch_results)

        # --- STAGE 3: VALIDATION & TTS & FIXING ---
        if on_progress:
            await on_progress({"type": "status", "message": "Validating and preparing scenes..."})
            
        for i, scene in enumerate(scenes):
            scene_num = scene.get('scene_number') or (i + 1)
            python_file = all_scene_files.get(scene_num)
            
            # 1. Generate TTS
            narration = scene.get('narration')
            if narration:
                audio_path = await generate_tts(narration, scene_num)
                if audio_path:
                    scene['audio_path'] = audio_path
            
            # 2. Validate and Fix
            if python_file:
                attempts = 0
                max_fix_attempts = 2
                while attempts <= max_fix_attempts:
                    validation_result = validate_manim_code(python_file)
                    if validation_result['valid']:
                        break
                    
                    attempts += 1
                    print(f"[Pipeline] ⚠️ Scene {scene_num} invalid (Attempt {attempts}). Fixing...")
                    
                    last_error = str(validation_result.get('issues'))
                    with open(python_file, 'r', encoding='utf-8') as f:
                        last_code = f.read()
                    
                    python_file = await generate_manim_code(scene, generator_config, last_error, last_code)
                    all_scene_files[scene_num] = python_file
            else:
                print(f"[Pipeline] ❌ Missing code for Scene {scene_num}")

        # --- STAGE 4: SEQUENTIAL RENDERING + PER-SCENE MUXING ---
        if on_progress:
            await on_progress({"type": "status", "message": "Rendering scenes one by one..."})

        muxed_scene_videos = []  # list of paths to muxed (video+audio) scene clips
        tmp_muxed_dir = os.path.join(os.getcwd(), 'tmp', 'muxed_scenes')
        if not os.path.exists(tmp_muxed_dir):
            os.makedirs(tmp_muxed_dir)

        for i, scene in enumerate(scenes):
            scene_num = scene.get('scene_number') or (i + 1)
            python_file = all_scene_files.get(scene_num)
            
            if not python_file:
                print(f"[Pipeline] ⏩ Skipping Scene {scene_num} (no code)")
                continue
                
            print(f"[Pipeline] 🎬 Rendering Scene {scene_num}...")
            if on_progress:
                await on_progress({"type": "status", "message": f"Rendering Scene {scene_num}/{len(scenes)}..."})
                
            try:
                class_name = f"Scene{scene_num}"
                mp4_path = await render_scene(python_file, class_name, 'm')
                if not os.path.exists(mp4_path):
                    print(f"[Pipeline] ❌ Scene {scene_num} render failed (file not found).")
                    continue

                audio_path = scene.get('audio_path')
                if audio_path and os.path.exists(audio_path):
                    # Mux audio into this scene's video (adjusts duration to match)
                    muxed_path = os.path.join(tmp_muxed_dir, f"scene_{scene_num}_muxed.mp4")
                    await mux_scene_video_audio(mp4_path, audio_path, muxed_path)
                    muxed_scene_videos.append(muxed_path)
                    print(f"[Pipeline] ✅ Scene {scene_num} rendered + muxed.")
                else:
                    # No audio — use raw video
                    muxed_scene_videos.append(mp4_path)
                    print(f"[Pipeline] ✅ Scene {scene_num} rendered (no audio).")
            except Exception as e:
                print(f"[Pipeline] ❌ Scene {scene_num} render/mux failed: {e}")

        # --- STAGE 5: FINAL CONCATENATION ---
        if not muxed_scene_videos:
             return {"success": False, "error": "No scenes rendered successfully."}

        if on_progress:
            await on_progress({"type": "status", "message": "Merging final video..."})

        slug = re.sub(r'[^a-z0-9]+', '_', topic.lower())[:60]
        final_file_name = f"video_{uuid.uuid4().hex[:8]}_{slug}.mp4"
        final_path = await concatenate_videos(muxed_scene_videos, final_file_name)
        
        if on_progress:
            await on_progress({"type": "final_video", "video_url": f"/videos/{os.path.basename(final_path)}"})
            
        # Cleanup temporary muxed scenes
        try:
            if os.path.exists(tmp_muxed_dir):
                shutil.rmtree(tmp_muxed_dir)
                print(f"[Pipeline] 🧹 Cleaned up temporary muxed scenes: {tmp_muxed_dir}")
        except Exception as cleanup_err:
            print(f"[Pipeline] ⚠️ Cleanup error: {cleanup_err}")

        return {"success": True, "video_path": final_path}

    except Exception as e:
        print(f"[Pipeline] Fatal Pipeline Error: {e}")
        return {"success": False, "error": str(e)}

