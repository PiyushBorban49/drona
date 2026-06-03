from manim import *
import numpy as np
import random

class Scene13(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_13.mp3")
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
        
        title = Text("Real-World\nApplications", color="#FFFFFF").next_to(core, UP)
        self.play(
            Write(title),
            run_time=2
        )
        
        web_browser = Rectangle(color="#4A90D9", fill_opacity=1).next_to(core, DOWN).scale(0.5)
        web_browser_glow_1 = Rectangle(color="#4A90D9", stroke_width=0, fill_opacity=0.1).next_to(core, DOWN).scale(0.6)
        web_browser_glow_2 = Rectangle(color="#4A90D9", stroke_width=0, fill_opacity=0.05).next_to(core, DOWN).scale(0.7)
        web_browser_group = VGroup(web_browser_glow_2, web_browser_glow_1, web_browser)
        
        database = Circle(color="#06D6A0", fill_opacity=1).next_to(web_browser, DOWN).scale(0.5)
        database_glow_1 = Circle(color="#06D6A0", stroke_width=0, fill_opacity=0.1).next_to(web_browser, DOWN).scale(0.6)
        database_glow_2 = Circle(color="#06D6A0", stroke_width=0, fill_opacity=0.05).next_to(web_browser, DOWN).scale(0.7)
        database_group = VGroup(database_glow_2, database_glow_1, database)
        
        operating_system = Rectangle(color="#EF476F", fill_opacity=1).next_to(database, DOWN).scale(0.5)
        operating_system_glow_1 = Rectangle(color="#EF476F", stroke_width=0, fill_opacity=0.1).next_to(database, DOWN).scale(0.6)
        operating_system_glow_2 = Rectangle(color="#EF476F", stroke_width=0, fill_opacity=0.05).next_to(database, DOWN).scale(0.7)
        operating_system_group = VGroup(operating_system_glow_2, operating_system_glow_1, operating_system)
        
        self.play(
            LaggedStart(
                FadeIn(web_browser_glow_2),
                FadeIn(web_browser_glow_1),
                GrowFromCenter(web_browser),
                FadeIn(database_glow_2),
                FadeIn(database_glow_1),
                GrowFromCenter(database),
                FadeIn(operating_system_glow_2),
                FadeIn(operating_system_glow_1),
                GrowFromCenter(operating_system),
                lag_ratio=0.2
            ),
            run_time=4
        )
        
        web_browser_label = Text("Web\nBrowser", color="#FFFFFF").next_to(web_browser, RIGHT)
        database_label = Text("Database", color="#FFFFFF").next_to(database, RIGHT)
        operating_system_label = Text("Operating\nSystem", color="#FFFFFF").next_to(operating_system, RIGHT)
        
        self.play(
            Write(web_browser_label),
            Write(database_label),
            Write(operating_system_label),
            run_time=2
        )
        
        self.wait(8)