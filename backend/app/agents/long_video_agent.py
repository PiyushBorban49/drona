"""
Dronacharya v3 — Long-form Video Agent
Orchestrates the generation of 10-20 minute videos by chunking the topic into 
multiple scenes and sequencing them through the CodeSim pipeline.
"""
import os
import re
import json
import asyncio
import subprocess
from langchain_core.messages import HumanMessage
from app.dependencies import get_llm_strict
from app.agents.video_agent import generate_subtopic_video

async def _llm_call_json(prompt: str, max_retries: int = 3) -> dict:
    """Call the LLM and parse the JSON response, with rate limit retries."""
    llm = get_llm_strict()

    for attempt in range(max_retries):
        try:
            if attempt > 0:
                print(f"    [LLM] Rate limit or error hit. Retrying in {4 * attempt} seconds...")
                await asyncio.sleep(4 * attempt)
            else:
                await asyncio.sleep(2)

            response = await asyncio.to_thread(llm.invoke, [HumanMessage(content=prompt)])
            content = response.content.strip()

            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            try:
                return json.loads(content, strict=False)
            except json.JSONDecodeError:
                content = content.replace("\n", "\\n").replace("\r", "\\r")
                return json.loads(content, strict=False)
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"    [LLM] Request failed after {max_retries} attempts: {e}")
                return {}

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

async def generate_course_video(
    topic: str,
    target_duration_minutes: int = 10,
    output_dir: str = None,
) -> dict:
    if output_dir is None:
        output_dir = os.path.join(_BACKEND_DIR, "media", "videos")
    elif not os.path.isabs(output_dir):
        output_dir = os.path.join(_BACKEND_DIR, output_dir)
    try:
        print(f"=== LONG VIDEO AGENT: Starting '{topic}' for {target_duration_minutes}m ===")
        safe_topic_id = re.sub(r"[^a-zA-Z0-9_]", "_", topic)[:20]
        
        # We assume 1 scene is roughly 1 minute of explanation+animation
        num_scenes = target_duration_minutes
        
        # Phase 1: Curriculum Planning
        print(f"  [Curriculum] Planning {num_scenes} scenes...")
        prompt = f"""You are the Curriculum Director for an educational video course.
Topic: {topic}
Target Duration: ~{target_duration_minutes} minutes

Break this topic down into exactly {num_scenes} sequential scenes. Each scene should cover about 1 minute of content.
For each scene, provide a Title, Description, and Key Points.

Rules:
1. Scene 1 should be the Introduction.
2. The final scene should be the Conclusion/Summary.
3. The middle scenes should logically build from basic to advanced concepts.

Return ONLY JSON matching this format:
{{
  "scenes": [
    {{
      "title": "Scene 1: Introduction to...",
      "description": "Welcome to the course. We will learn...",
      "key_points": ["Definition", "Importance"]
    }},
    ...
  ]
}}
"""
        curriculum_data = await _llm_call_json(prompt)
        scenes = curriculum_data.get("scenes", [])
        
        if not scenes:
            return {"success": False, "error": "Curriculum Agent failed to generate scenes."}
        
        # Ensure we don't accidentally do 100 scenes if LLM hallucinates
        scenes = scenes[:num_scenes]
        
        print(f"  [Curriculum] Successfully partitioned into {len(scenes)} scenes.")
        
        # Phase 2: Sequential Scene Generation
        scene_video_paths = []
        for index, scene in enumerate(scenes):
            scene_id = f"course_{safe_topic_id}_s{index+1}"
            scene_title = scene.get("title", f"Scene {index+1}")
            scene_desc = scene.get("description", "")
            scene_points = scene.get("key_points", [])
            
            print(f"\n  >>> Starting Scene {index+1}/{len(scenes)}: {scene_title}")
            
            result = await generate_subtopic_video(
                subtopic_id=scene_id,
                title=scene_title,
                description=scene_desc,
                key_points=scene_points,
                output_dir=output_dir,
            )
            
            if result.get("success"):
                vid_path = result.get("video_path")
                scene_video_paths.append(vid_path)
                print(f"  <<< Scene {index+1} finished: {vid_path}")
            else:
                print(f"  <<< Scene {index+1} FAILED: {result.get('error')}")
                # We could abort, but it's better to just skip and continue the merged video
                continue
                
        if not scene_video_paths:
            return {"success": False, "error": "All scenes failed to generate."}
            
        print(f"\n  [Stitcher] Merging {len(scene_video_paths)} scenes...")
        
        # Phase 3: Concatenation using ffmpeg
        final_merged_path = os.path.join(output_dir, f"course_{safe_topic_id}_full.mp4").replace("\\", "/")
        list_file_path = os.path.join(output_dir, f"concat_{safe_topic_id}.txt").replace("\\", "/")
        
        # Create the ffmpeg concat list
        with open(list_file_path, "w", encoding="utf-8") as f:
            for path in scene_video_paths:
                absolute_path = os.path.abspath(path).replace("\\", "/")
                f.write(f"file '{absolute_path}'\n")
                
        # Run ffmpeg concat from backend root
        merge_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", 
            "-i", list_file_path, 
            "-c", "copy", final_merged_path
        ]
        
        proc_result = await asyncio.to_thread(subprocess.run, merge_cmd, capture_output=True)
        
        if os.path.exists(final_merged_path):
            print(f"=== LONG VIDEO AGENT: Course generation complete! {final_merged_path} ===")
            return {"success": True, "video_path": final_merged_path}
        else:
            return {"success": False, "error": f"Failed to merge scenes: {proc_result.stderr.decode('utf-8')}"}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
