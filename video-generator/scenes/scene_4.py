from manim import *
import numpy as np
import random

class Scene4(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_4.mp3")
        self.camera.background_color = "#1b1d2b"
        
        # Background grid
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        # Memory frames
        frames = []
        for i in range(4):
            frame = Rectangle(width=2, height=1, color="#06D6A0", fill_opacity=0.1, stroke_width=0)
            frame_core = Rectangle(width=2, height=1, color="#06D6A0", fill_opacity=1)
            frame_glow = Rectangle(width=2.2, height=1.2, color="#06D6A0", fill_opacity=0.05, stroke_width=0)
            frame_group = VGroup(frame_glow, frame, frame_core)
            frame_group.shift(UP * i * 2)
            frames.append(frame_group)
            self.add(frame_group)
            frame_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        
        # Page text
        page_text = []
        for i in range(4):
            text = Text(f"Page {i+1}", color="#FFFFFF").next_to(frames[i], DOWN)
            page_text.append(text)
        
        # Animation
        self.play(LaggedStart(*[FadeIn(frame) for frame in frames], lag_ratio=0.2), run_time=3)
        self.play(LaggedStart(*[Write(text) for text in page_text], lag_ratio=0.2), run_time=2)
        
        # Narration text
        narration_text = Text("For example, let's say we have a process that requires 16 kilobytes of memory.", color="#FFFFFF").scale(0.7).to_edge(UP)
        self.play(Write(narration_text), run_time=2)
        self.wait(1)
        narration_text_2 = Text("If the page size is 4 kilobytes, the process will be divided into 4 pages.", color="#FFFFFF").scale(0.7).next_to(narration_text, DOWN)
        self.play(Write(narration_text_2), run_time=2)
        self.wait(1)
        narration_text_3 = Text("Each page will be stored in a separate frame in memory.", color="#FFFFFF").scale(0.7).next_to(narration_text_2, DOWN)
        self.play(Write(narration_text_3), run_time=2)
        
        # Camera zoom
        self.play(self.camera.frame.animate.scale(0.8).move_to(frames[2]), run_time=2)
        
        # Hold while audio finishes
        self.wait(10)