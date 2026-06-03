from manim import *
import numpy as np
import random

class Scene3(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_3.mp3")
        self.camera.background_color = "#1b1d2b"
        
        # Background
        bg_rect = Rectangle(fill_color="#1b1d2b", fill_opacity=1, stroke_width=0)
        self.add(bg_rect)
        
        # Glowing core object
        core = Circle(radius=1.0, color="#FFD166", fill_opacity=1)
        glow_1 = Circle(radius=1.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Circle(radius=1.8, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        hero_group = VGroup(glow_2, glow_1, core)
        hero_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        # Page blocks
        page_blocks = VGroup()
        for i in range(10):
            block = Rectangle(width=1, height=0.5, color="#4A90D9", fill_opacity=0.5, stroke_width=0)
            block.shift(UP * (i - 5) * 0.6)
            page_blocks.add(block)
        
        # Reveal cinematic style
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(core), lag_ratio=0.2), run_time=2)
        self.play(LaggedStart(*[FadeIn(block) for block in page_blocks], lag_ratio=0.1), run_time=2)
        
        # Action & Camera Zoom
        title = Text("Paging", color="#FFFFFF").next_to(core, UP)
        self.play(
            Write(title),
            self.camera.frame.animate.scale(0.8).move_to(hero_group), 
            run_time=2
        )
        
        # Narration
        narration = Text("Paging is a technique\nwhere a process is\ndivided into fixed-size\nblocks, called pages.", color="#FFFFFF", font_size=24)
        narration.shift(DOWN * 2)
        self.play(Write(narration), run_time=3)
        
        # Hold while audio finishes
        self.wait(8)