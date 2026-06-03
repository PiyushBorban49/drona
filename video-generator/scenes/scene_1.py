from manim import *
import numpy as np
import random

class Scene1(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_1.mp3")
        self.camera.background_color = "#1b1d2b"
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        computer = Rectangle(width=4, height=2, color="#E8834E", fill_opacity=1)
        glow_1 = Rectangle(width=4.3, height=2.3, color="#E8834E", stroke_width=0, fill_opacity=0.1)
        glow_2 = Rectangle(width=4.8, height=2.8, color="#E8834E", stroke_width=0, fill_opacity=0.05)
        computer_group = VGroup(glow_2, glow_1, computer)
        
        brain = Circle(radius=1.0, color="#FFD166", fill_opacity=1)
        glow_brain_1 = Circle(radius=1.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_brain_2 = Circle(radius=1.8, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        brain_group = VGroup(glow_brain_2, glow_brain_1, brain)
        
        computer_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        brain_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(computer), lag_ratio=0.2), run_time=2)
        self.play(LaggedStart(FadeIn(glow_brain_2), FadeIn(glow_brain_1), GrowFromCenter(brain), lag_ratio=0.2), run_time=2)
        
        computer_group.next_to(brain_group, DOWN)
        
        title = Text("Memory Management", color="#FFFFFF").next_to(computer_group, UP)
        self.play(
            Write(title),
            self.camera.frame.animate.scale(0.8).move_to(computer_group), 
            run_time=2
        )
        
        narration = Text("Welcome to our video\non memory management.", color="#FFFFFF").next_to(title, DOWN)
        self.play(Write(narration), run_time=2)
        
        self.wait(2)