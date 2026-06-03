from manim import *
import numpy as np
import random

class Scene15(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_15.mp3")
        self.camera.background_color = "#1b1d2b"
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        core = Circle(radius=1.0, color="#FFD166", fill_opacity=1)
        glow_1 = Circle(radius=1.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Circle(radius=1.8, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        hero_group = VGroup(glow_2, glow_1, core)
        
        hero_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(core), lag_ratio=0.2), run_time=2)
        
        title = Text("Memory\nManagement", color="#FFFFFF").next_to(core, UP)
        self.play(
            Write(title),
            run_time=2
        )
        
        text1 = Text("Learn more", color="#FFFFFF").next_to(core, DOWN)
        self.play(Write(text1), run_time=1)
        
        self.wait(5)