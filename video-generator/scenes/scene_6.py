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

class Scene6(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_6.mp3")
        self.camera.background_color = BG_COLOR

        bg_grid = NumberPlane(background_line_style={"stroke_color": KURZGESAGT_BLUE, "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))

        code_segment = Rectangle(width=2, height=1, color=KURZGESAGT_ORANGE, fill_opacity=1)
        code_glow_1 = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_ORANGE, stroke_width=0, fill_opacity=0.1)
        code_glow_2 = Rectangle(width=2.5, height=1.5, color=KURZGESAGT_ORANGE, stroke_width=0, fill_opacity=0.05)
        code_group = VGroup(code_glow_2, code_glow_1, code_segment)
        code_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))

        data_segment = Rectangle(width=2, height=1, color=KURZGESAGT_BLUE, fill_opacity=1)
        data_glow_1 = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_BLUE, stroke_width=0, fill_opacity=0.1)
        data_glow_2 = Rectangle(width=2.5, height=1.5, color=KURZGESAGT_BLUE, stroke_width=0, fill_opacity=0.05)
        data_group = VGroup(data_glow_2, data_glow_1, data_segment)
        data_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        data_group.next_to(code_group, RIGHT, buff=1)

        stack_segment = Rectangle(width=2, height=1, color=KURZGESAGT_TEAL, fill_opacity=1)
        stack_glow_1 = Rectangle(width=2.2, height=1.2, color=KURZGESAGT_TEAL, stroke_width=0, fill_opacity=0.1)
        stack_glow_2 = Rectangle(width=2.5, height=1.5, color=KURZGESAGT_TEAL, stroke_width=0, fill_opacity=0.05)
        stack_group = VGroup(stack_glow_2, stack_glow_1, stack_segment)
        stack_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        stack_group.next_to(data_group, RIGHT, buff=1)

        self.play(LaggedStart(FadeIn(code_glow_2), FadeIn(code_glow_1), GrowFromCenter(code_segment), 
                             FadeIn(data_glow_2), FadeIn(data_glow_1), GrowFromCenter(data_segment), 
                             FadeIn(stack_glow_2), FadeIn(stack_glow_1), GrowFromCenter(stack_segment), 
                             lag_ratio=0.2), run_time=5)

        code_label = Text("Code", color="#FFFFFF").next_to(code_group, UP)
        data_label = Text("Data", color="#FFFFFF").next_to(data_group, UP)
        stack_label = Text("Stack", color="#FFFFFF").next_to(stack_group, UP)

        self.play(Write(code_label), Write(data_label), Write(stack_label), run_time=2)

        self.play(code_group.animate.scale(0.8), run_time=2)
        self.wait(5)
        self.play(data_group.animate.scale(0.8), run_time=2)
        self.wait(5)
        self.play(stack_group.animate.scale(0.8), run_time=2)
        self.wait(6)