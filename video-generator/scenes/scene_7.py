from manim import *
import numpy as np
import random

class Scene7(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_7.mp3")
        self.camera.background_color = "#1b1d2b"
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        memory_blocks = VGroup()
        for i in range(10):
            block = Rectangle(width=2, height=0.5, color="#06D6A0", fill_opacity=0.5)
            block.shift(UP * i)
            memory_blocks.add(block)
        
        self.play(LaggedStart(*[FadeIn(block) for block in memory_blocks], lag_ratio=0.1), run_time=3)
        
        process = Circle(radius=0.5, color="#FFD166", fill_opacity=1)
        glow_1 = Circle(radius=0.7, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Circle(radius=1.0, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        process_group = VGroup(glow_2, glow_1, process)
        process_group.shift(UP * 5)
        
        process_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(process), lag_ratio=0.2), run_time=2)
        
        allocation = Rectangle(width=4, height=2, color="#EF476F", fill_opacity=0.5)
        allocation.shift(UP * 3)
        
        self.play(GrowFromCenter(allocation), run_time=1)
        
        narration = Text("Contiguous allocation is a technique where a process is allocated a contiguous block of memory.", color="#FFFFFF").scale(0.5)
        narration.shift(DOWN * 3)
        
        self.play(Write(narration), run_time=3)
        
        fragmentation = Text("This technique is simple to implement, but it can lead to memory fragmentation.", color="#FFFFFF").scale(0.5)
        fragmentation.shift(DOWN * 4)
        
        self.play(Write(fragmentation), run_time=3)
        
        self.wait(5)