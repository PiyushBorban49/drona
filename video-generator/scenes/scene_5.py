from manim import *
import numpy as np
import random

class Scene5(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_5.mp3")
        self.camera.background_color = "#1b1d2b"
        
        # Background
        bg_rect = Rectangle(width=20, height=15, color="#1b1d2b", fill_opacity=1)
        self.add(bg_rect)
        
        # Segments
        code_segment = Rectangle(width=2, height=1, color=KURZGESAGT_ORANGE, fill_opacity=1)
        data_segment = Rectangle(width=2, height=1, color=KURZGESAGT_YELLOW, fill_opacity=1)
        stack_segment = Rectangle(width=2, height=1, color=KURZGESAGT_BLUE, fill_opacity=1)
        
        code_glow = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_ORANGE, stroke_width=0, fill_opacity=0.1)
        data_glow = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_YELLOW, stroke_width=0, fill_opacity=0.1)
        stack_glow = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_BLUE, stroke_width=0, fill_opacity=0.1)
        
        code_group = VGroup(code_glow, code_segment)
        data_group = VGroup(data_glow, data_segment)
        stack_group = VGroup(stack_glow, stack_segment)
        
        code_group.add_updater(lambda m, dt: m.shift(UP * dt * 0.01))
        data_group.add_updater(lambda m, dt: m.shift(DOWN * dt * 0.01))
        stack_group.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.01))
        
        # Initial positions
        code_group.next_to(bg_rect, UP)
        data_group.next_to(bg_rect, DOWN)
        stack_group.next_to(bg_rect, LEFT)
        
        # Reveal segments
        self.play(LaggedStart(FadeIn(code_group), FadeIn(data_group), FadeIn(stack_group), lag_ratio=0.2), run_time=3)
        
        # Narration
        narration = Text("Segmentation is a technique where a process is divided into logical segments, such as code, data, and stack.", color="#FFFFFF").scale(0.5)
        narration.next_to(bg_rect, UP)
        self.play(Write(narration), run_time=2)
        
        # Highlight segments
        self.play(Circumscribe(code_group, color=KURZGESAGT_RED), run_time=1)
        self.play(Circumscribe(data_group, color=KURZGESAGT_RED), run_time=1)
        self.play(Circumscribe(stack_group, color=KURZGESAGT_RED), run_time=1)
        
        # Camera zoom
        self.play(self.camera.frame.animate.scale(0.8).move_to(code_group), run_time=2)
        
        # Hold while audio finishes
        self.wait(8)