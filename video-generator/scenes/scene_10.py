from manim import *
import numpy as np
import random

BG_COLOR = "#1b1d2b"
KURZGESAGT_ORANGE = "#E8834E"
KURZGESAGT_YELLOW = "#FFD166"
KURZGESAGT_BLUE = "#4A90D9"
KURZGESAGT_TEAL = "#06D6A0"
KURZGESAGT_RED = "#EF476F"
KURZGESAGT_PURPLE = "#7B2FBE"

class Scene10(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_10.mp3")
        self.camera.background_color = BG_COLOR
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": KURZGESAGT_BLUE, "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        memory = Rectangle(width=4, height=2, color=KURZGESAGT_BLUE, fill_opacity=1)
        memory_glow_1 = Rectangle(width=4.2, height=2.2, color=KURZGESAGT_BLUE, stroke_width=0, fill_opacity=0.1)
        memory_glow_2 = Rectangle(width=4.5, height=2.5, color=KURZGESAGT_BLUE, stroke_width=0, fill_opacity=0.05)
        memory_group = VGroup(memory_glow_2, memory_glow_1, memory)
        memory_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        
        disk = Circle(radius=1.5, color=KURZGESAGT_ORANGE, fill_opacity=1)
        disk_glow_1 = Circle(radius=1.8, color=KURZGESAGT_ORANGE, stroke_width=0, fill_opacity=0.1)
        disk_glow_2 = Circle(radius=2.2, color=KURZGESAGT_ORANGE, stroke_width=0, fill_opacity=0.05)
        disk_group = VGroup(disk_glow_2, disk_glow_1, disk)
        disk_group.add_updater(lambda m, dt: m.rotate(dt * 0.3))
        
        self.play(LaggedStart(FadeIn(memory_glow_2), FadeIn(memory_glow_1), GrowFromCenter(memory), lag_ratio=0.2), run_time=2)
        self.play(LaggedStart(FadeIn(disk_glow_2), FadeIn(disk_glow_1), GrowFromCenter(disk), lag_ratio=0.2), run_time=2)
        
        memory_label = Text("Memory", color="#FFFFFF").next_to(memory, UP)
        disk_label = Text("Disk", color="#FFFFFF").next_to(disk, UP)
        
        self.play(Write(memory_label), Write(disk_label), run_time=1)
        
        page = Rectangle(width=0.5, height=0.5, color=KURZGESAGT_YELLOW, fill_opacity=1)
        page_glow_1 = Rectangle(width=0.7, height=0.7, color=KURZGESAGT_YELLOW, stroke_width=0, fill_opacity=0.1)
        page_glow_2 = Rectangle(width=1, height=1, color=KURZGESAGT_YELLOW, stroke_width=0, fill_opacity=0.05)
        page_group = VGroup(page_glow_2, page_glow_1, page)
        page_group.add_updater(lambda m, dt: m.rotate(dt * 0.4))
        
        self.play(LaggedStart(FadeIn(page_glow_2), FadeIn(page_glow_1), GrowFromCenter(page), lag_ratio=0.2), run_time=1)
        
        self.play(self.camera.frame.animate.scale(0.8).move_to(page), run_time=1)
        
        narration = Text("For example, let's say we\nhave a process that requires\n32 kilobytes of memory,\nbut only 16 kilobytes are\nphysically available.", color="#FFFFFF")
        self.play(Write(narration), run_time=3)
        
        self.play(FadeOut(narration), run_time=1)
        
        self.wait(10)