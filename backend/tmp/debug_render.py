import asyncio
import sys
import os
import traceback

# Add current dir to path to import app
sys.path.append(os.getcwd())

from app.video_generator.renderer import render_scene

async def test():
    # Use an existing scene file if possible
    scene_file = os.path.join(os.getcwd(), 'tmp', 'scenes', 'scene_1.py')
    if not os.path.exists(scene_file):
        print(f"Scene file not found: {scene_file}")
        # Create a dummy one
        if not os.path.exists('tmp/scenes'): os.makedirs('tmp/scenes')
        with open(scene_file, 'w') as f:
            f.write("from manim import *\nclass Scene1(Scene):\n    def construct(self):\n        self.add(Text('Test'))")

    print(f"Testing render_scene with {scene_file}...")
    try:
        path = await render_scene(scene_file, "Scene1", 'l')
        print(f"Success! Path: {path}")
    except Exception:
        print("Caught exception in test:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
