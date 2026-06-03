from manim import *
import numpy as np
import random

class Scene14(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_14.mp3")
        self.camera.background_color = "#1b1d2b"

        bg_rect = Rectangle(fill_color="#1b1d2b", fill_opacity=1, stroke_width=0)
        self.add(bg_rect)

        particles = VGroup()
        for _ in range(50):
            particle = Dot(radius=0.05, color="#4A90D9", fill_opacity=1)
            particle.shift(np.array([random.uniform(-5, 5), random.uniform(-3, 3), 0]))
            particles.add(particle)
            particle.add_updater(lambda m, dt: m.shift(UP * dt * 0.1))
        self.add(particles)

        title = Text("Future Directions", color="#FFFFFF")
        self.play(FadeIn(title), run_time=2)

        subtitle = Text("New Techniques\nand Technologies", color="#FFFFFF")
        subtitle.next_to(title, DOWN)
        self.play(Write(subtitle), run_time=2)

        tech_bubble = Circle(radius=1.0, color="#FFD166", fill_opacity=1)
        glow_1 = Circle(radius=1.3, color="#FFD166", stroke_width=0, fill_opacity=0.1)
        glow_2 = Circle(radius=1.8, color="#FFD166", stroke_width=0, fill_opacity=0.05)
        tech_group = VGroup(glow_2, glow_1, tech_bubble)
        tech_group.shift(2 * RIGHT)
        tech_group.add_updater(lambda m, dt: m.rotate(dt * 0.2))
        self.play(LaggedStart(FadeIn(glow_2), FadeIn(glow_1), GrowFromCenter(tech_bubble), lag_ratio=0.2), run_time=2)

        self.play(self.camera.frame.animate.scale(0.8).move_to(tech_group), run_time=2)

        narration = Text("As computer systems continue\nto evolve, new memory\nmanagement techniques\nand technologies are\nbeing developed.", color="#FFFFFF")
        narration.shift(3 * LEFT)
        self.play(Write(narration), run_time=4)

        self.wait(4)