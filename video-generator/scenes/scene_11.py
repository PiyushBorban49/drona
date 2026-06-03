from manim import *
import numpy as np
import random

class Scene11(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_11.mp3")
        self.camera.background_color = "#1b1d2b"

        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))

        table = Table([["Technique", "Advantages", "Disadvantages"], 
                       ["Paging", "Simple to implement", "Page faults"], 
                       ["Segmentation", "Better memory protection", "More complex"], 
                       ["Contiguous allocation", "Simple", "Memory fragmentation"]], 
                       include_outer_lines=True)
        table.scale(0.7)

        glow_1 = Rectangle(width=10, height=6, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        glow_2 = Rectangle(width=10.5, height=6.5, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        core = Rectangle(width=10, height=6, color="#FFD166", fill_opacity=1)
        hero_group = VGroup(glow_2, glow_1, core)
        hero_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))

        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(core), lag_ratio=0.2), run_time=2)

        self.play(FadeIn(table), run_time=2)
        self.play(self.camera.frame.animate.scale(0.8).move_to(table), run_time=2)

        narration1 = Text("Each memory management", color="#FFFFFF").next_to(table, UP)
        narration2 = Text("technique has its own", color="#FFFFFF").next_to(narration1, DOWN)
        narration3 = Text("advantages and disadvantages.", color="#FFFFFF").next_to(narration2, DOWN)
        self.play(Write(narration1), Write(narration2), Write(narration3), run_time=3)

        paging = Text("Paging is simple to", color="#FFFFFF").next_to(table, DOWN)
        paging2 = Text("implement, but can lead", color="#FFFFFF").next_to(paging, DOWN)
        paging3 = Text("to page faults.", color="#FFFFFF").next_to(paging2, DOWN)
        self.play(Write(paging), Write(paging2), Write(paging3), run_time=3)

        segmentation = Text("Segmentation is more", color="#FFFFFF").next_to(paging3, DOWN)
        segmentation2 = Text("complex, but provides", color="#FFFFFF").next_to(segmentation, DOWN)
        segmentation3 = Text("better memory protection.", color="#FFFFFF").next_to(segmentation2, DOWN)
        self.play(Write(segmentation), Write(segmentation2), Write(segmentation3), run_time=3)

        contiguous = Text("Contiguous allocation is", color="#FFFFFF").next_to(segmentation3, DOWN)
        contiguous2 = Text("simple, but can lead to", color="#FFFFFF").next_to(contiguous, DOWN)
        contiguous3 = Text("memory fragmentation.", color="#FFFFFF").next_to(contiguous2, DOWN)
        self.play(Write(contiguous), Write(contiguous2), Write(contiguous3), run_time=3)

        self.wait(5)