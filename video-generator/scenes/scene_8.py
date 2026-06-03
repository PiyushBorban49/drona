from manim import *
import numpy as np
import random

class Scene8(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_8.mp3")
        self.camera.background_color = "#1b1d2b"
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        memory_block = Rectangle(width=8, height=2, color="#FFD166", fill_opacity=1)
        glow_1 = Rectangle(width=8.3, height=2.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Rectangle(width=9, height=3, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        memory_group = VGroup(glow_2, glow_1, memory_block)
        
        memory_group.add_updater(lambda m, dt: m.shift(UP * dt * 0.05))
        
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), DrawBorderThenFill(memory_block), lag_ratio=0.2), run_time=3)
        
        process_text = Text("Process", color="#FFFFFF").next_to(memory_block, UP)
        self.play(Write(process_text), run_time=2)
        
        fragmentation_text = Text("Memory Fragmentation", color="#FFFFFF").next_to(memory_block, DOWN)
        self.play(Write(fragmentation_text), run_time=2)
        
        fragmentation_blocks = VGroup(
            Rectangle(width=1, height=1, color="#EF476F", fill_opacity=1),
            Rectangle(width=1, height=1, color="#EF476F", fill_opacity=1),
            Rectangle(width=1, height=1, color="#EF476F", fill_opacity=1)
        ).arrange(RIGHT, buff=0.1).next_to(memory_block, DOWN)
        
        self.play(LaggedStart(FadeIn(fragmentation_blocks[0]), FadeIn(fragmentation_blocks[1]), FadeIn(fragmentation_blocks[2]), lag_ratio=0.2), run_time=3)
        
        self.play(self.camera.frame.animate.scale(0.8).move_to(memory_block), run_time=2)
        
        self.wait(10)