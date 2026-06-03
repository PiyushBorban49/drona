from manim import *
import numpy as np
import random

class Scene2(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_2.mp3")
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
        
        title = Text("Memory Management", color="#FFFFFF").next_to(core, UP)
        self.play(
            Write(title),
            self.camera.frame.animate.scale(0.8).move_to(core),
            run_time=2
        )
        
        table = Table([["Paging", "Segmentation", "Contiguous Allocation"], 
                        ["Divide memory into fixed-size blocks", "Divide memory into variable-size blocks", "Allocate memory contiguously"]], 
                       include_outer_lines=True)
        table.next_to(core, DOWN)
        
        self.play(LaggedStart(*[FadeIn(m) for m in table], lag_ratio=0.1), run_time=3)
        
        narration = Text("There are several techniques\nused to manage memory,\nincluding paging,\nsegmentation, contiguous\nallocation, and more.", color="#FFFFFF").next_to(table, DOWN)
        self.play(Write(narration), run_time=3)
        
        self.wait(5)