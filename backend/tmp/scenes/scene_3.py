
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene3(Scene):
    def construct(self):
        self.camera.background_color = "#121214"
        
        # Title
        title = Text("Enter KMP – A Smart Shortcut", font_size=40, color="#EAEAEF")
        title.to_edge(UP, buff=0.5)
        self.play(FadeIn(title, shift=UP * 0.3))
        
        # Draw a custom highway / pathway
        # Let's create a main path and a visual "shortcut" bridge bypassing a loop
        main_path = VMobject(color="#334155")
        main_path.set_points_as_corners([
            LEFT * 5 + DOWN * 1,
            LEFT * 2 + DOWN * 1,
            LEFT * 1 + UP * 1,
            RIGHT * 1 + UP * 1,
            RIGHT * 2 + DOWN * 1,
            RIGHT * 5 + DOWN * 1
        ])
        main_path.set_stroke(width=8)
        
        # Redundant comparisons loop (scenic detour representing naive checks)
        detour_path = VMobject(color="#EF4444")
        detour_path.set_points_as_corners([
            LEFT * 1 + UP * 1,
            LEFT * 0.5 + UP * 2.2,
            ORIGIN + UP * 2.5,
            RIGHT * 0.5 + UP * 2.2,
            RIGHT * 1 + UP * 1
        ])
        detour_path.set_stroke(width=4, opacity=0.8)
        
        # Fast KMP Shortcut line
        shortcut_path = CurvedArrow(LEFT * 1.5 + DOWN * 0.8, RIGHT * 1.5 + DOWN * 0.8, angle=-PI/3, color="#10B981")
        shortcut_path.set_stroke(width=6)
        
        labels = VGroup(
            Text("Naïve Route (Slow)", font_size=14, color="#EF4444").move_to(ORIGIN + UP * 2.8),
            Text("LPS Shortcut (Instant)", font_size=16, color="#10B981").next_to(shortcut_path, DOWN, buff=0.2)
        )
        
        self.play(Create(main_path), Create(detour_path), run_time=1.5)
        self.play(FadeIn(labels[0]))
        self.wait(0.5)
        
        # Car representation (small dot/arrow)
        car = Dot(color="#F59E0B", radius=0.15)
        # Add a little glow
        glow = ArcScatter(color="#F59E0B") # standard manim doesn't have ArcScatter easily, let's use a subtle ring
        ring = Circle(radius=0.25, stroke_color="#F59E0B", stroke_width=2).move_to(car)
        car_group = VGroup(car, ring)
        
        # Naïve journey simulation (takes the detour)
        self.play(FadeIn(car_group))
        car_group.move_to(LEFT * 5 + DOWN * 1)
        
        self.play(
            car_group.animate.move_to(LEFT * 2 + DOWN * 1),
            rate_func=linear, run_time=0.8
        )
        self.play(
            car_group.animate.move_to(LEFT * 1 + UP * 1),
            rate_func=linear, run_time=0.5
        )
        # Detour loop entry
        self.play(
            car_group.animate.move_to(LEFT * 0.5 + UP * 2.2),
            rate_func=linear, run_time=0.4
        )
        self.play(
            car_group.animate.move_to(ORIGIN + UP * 2.5),
            rate_func=linear, run_time=0.4
        )
        self.play(
            car_group.animate.move_to(RIGHT * 0.5 + UP * 2.2),
            rate_func=linear, run_time=0.4
        )
        self.play(
            car_group.animate.move_to(RIGHT * 1 + UP * 1),
            rate_func=linear, run_time=0.4
        )
        
        # Stop and reset to show KMP speed
        self.wait(0.5)
        self.play(car_group.animate.move_to(LEFT * 5 + DOWN * 1))
        
        # Draw KMP shortcut
        self.play(Create(shortcut_path), FadeIn(labels[1]))
        
        # Highlight GPS / Smart navigation
        gps_indicator = Text("GPS: Smart Skip!", font_size=18, color="#00ADB5").to_edge(LEFT, buff=1).shift(UP * 2)
        self.play(Write(gps_indicator))
        self.wait(0.5)
        
        # Fast run utilizing LPS Shortcut
        self.play(
            car_group.animate.move_to(LEFT * 1.5 + DOWN * 1),
            rate_func=linear, run_time=0.6
        )
        # Zip through shortcut instantly!
        self.play(
            MoveAlongPath(car_group, shortcut_path),
            rate_func=ease_out_cubic, run_time=1.2
        )
        self.play(
            car_group.animate.move_to(RIGHT * 5 + DOWN * 1),
            rate_func=linear, run_time=0.8
        )
        
        self.wait(1.5)