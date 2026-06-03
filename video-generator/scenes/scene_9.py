from manim import *
import numpy as np
import random

class Scene9(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_9.mp3")
        self.camera.background_color = "#1b1d2b"
        
        bg_grid = NumberPlane(background_line_style={"stroke_color": "#4A90D9", "stroke_opacity": 0.1})
        self.add(bg_grid)
        bg_grid.add_updater(lambda m, dt: m.shift(LEFT * dt * 0.1))
        
        core = Rectangle(width=4, height=2, color="#FFD166", fill_opacity=1)
        glow_1 = Rectangle(width=4.3, height=2.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Rectangle(width=4.8, height=2.8, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        hero_group = VGroup(glow_2, glow_1, core)
        
        hero_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(core), lag_ratio=0.2), run_time=2)
        
        title = Text("Virtual Memory", color="#FFFFFF").next_to(core, UP)
        self.play(
            Write(title),
            self.camera.frame.animate.scale(0.8).move_to(core),
            run_time=2
        )
        
        page1 = Rectangle(width=0.5, height=0.5, color="#06D6A0", fill_opacity=1)
        page1.next_to(core, DOWN)
        self.play(FadeIn(page1), run_time=1)
        
        page2 = Rectangle(width=0.5, height=0.5, color="#EF476F", fill_opacity=1)
        page2.next_to(page1, RIGHT)
        self.play(FadeIn(page2), run_time=1)
        
        disk = Circle(radius=1.0, color="#7B2FBE", fill_opacity=1)
        disk.next_to(core, LEFT)
        glow_3 = Circle(radius=1.3, color="#7B2FBE", stroke_width=0, fill_opacity=0.1)
        glow_4 = Circle(radius=1.8, color="#7B2FBE", stroke_width=0, fill_opacity=0.05)
        disk_group = VGroup(glow_4, glow_3, disk)
        disk_group.add_updater(lambda m, dt: m.rotate(dt * 0.5))
        
        self.play(LaggedStart(FadeIn(glow_4), FadeIn(glow_3), GrowFromCenter(disk), lag_ratio=0.2), run_time=2)
        
        self.play(
            page1.animate.move_to(disk),
            page2.animate.move_to(disk),
            run_time=2
        )
        
        self.play(
            page1.animate.move_to(core),
            page2.animate.move_to(core),
            run_time=2
        )
        
        narration = Text("Virtual memory is a\n technique where a\n process can use more\n memory than is\n physically available.", color="#FFFFFF", font_size=24).next_to(core, DOWN)
        self.play(Write(narration), run_time=3)
        
        self.wait(5)