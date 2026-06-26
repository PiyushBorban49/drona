
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)

import numpy as np
import random

BG_DARK = "#0F1120"
BG_NAVY = "#1B1D2B"
ORANGE = "#E8834E"
YELLOW = "#FFD166"
BLUE = "#4A90D9"
TEAL = "#06D6A0"
RED = "#EF476F"
PURPLE = "#7B2FBE"
SOFT_WHITE = "#E8E8E8"

class Scene1(Scene):
    def construct(self):
        # Phase 1: Background
        self.camera.background_color = BG_NAVY
        stars = VGroup()
        for _ in range(80):
            star = Dot(
                point=np.array([random.uniform(-7.5, 7.5), random.uniform(-4.5, 4.5), 0]),
                radius=random.uniform(0.01, 0.04),
                color=WHITE,
                fill_opacity=random.uniform(0.2, 0.7)
            )
            stars.add(star)
        self.add(stars)
        self.play(FadeIn(stars, run_time=2), rate_func=smooth)

        # Phase 2: Particle field converging to "RADAR"
        particle_field = VGroup()
        for _ in range(120):
            dot = Dot(
                point=np.array([random.uniform(-7, 7), random.uniform(-4, 4), 0]),
                radius=0.04,
                color=TEAL,
                fill_opacity=0.8
            )
            particle_field.add(dot)
        self.add(particle_field)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in particle_field], lag_ratio=0.02, run_time=1.5))

        radar_text = Text("RADAR", font_size=96, color=TEAL, weight=BOLD)
        radar_text.move_to(ORIGIN)

        # Glow layers for RADAR
        glow1 = Circle(radius=radar_text.width/2+0.3, color=TEAL, fill_opacity=0.15, stroke_width=0)
        glow2 = Circle(radius=radar_text.width/2+0.6, color=TEAL, fill_opacity=0.05, stroke_width=0)
        radar_group = VGroup(glow2, glow1, radar_text)

        # Move particles to center then replace with RADAR
        self.play(particle_field.animate.shift(ORIGIN - particle_field.get_center()), run_time=1.5, rate_func=linear)
        self.play(ReplacementTransform(particle_field, radar_group), run_time=2, rate_func=smooth)

        # Phase 3: Title reveal
        title = Text("Manacher's Algorithm", font_size=36, color=SOFT_WHITE, weight=BOLD)
        title.move_to(DOWN*3.5)
        halo_outer = Circle(radius=title.width/2+0.6, color=ORANGE, fill_opacity=0.08, stroke_width=0)
        halo_inner = Circle(radius=title.width/2+0.3, color=ORANGE, fill_opacity=0.15, stroke_width=0)
        title_halo = VGroup(halo_outer, halo_inner, title)

        self.play(FadeIn(halo_outer), FadeIn(halo_inner), run_time=0.8)
        self.play(title.animate.shift(UP*3.5), run_time=1.2, rate_func=rush_into)
        self.play(Circumscribe(title, color=YELLOW, run_time=1.5))

        # Phase 4: Orbiting particles around RADAR
        orbiters = VGroup()
        for i in range(12):
            dot = Dot(radius=0.06, color=ORANGE, fill_opacity=0.9)
            angle = i * TAU / 12
            radius = radar_text.width/2 + 0.5
            dot.move_to(radar_text.get_center() + radius * np.array([np.cos(angle), np.sin(angle), 0]))
            orbiters.add(dot)

        self.add(orbiters)

        tracker = ValueTracker(0)
        def rotate_orbit(mob, dt):
            mob.rotate(dt * 0.5, about_point=radar_text.get_center())
        orbiters.add_updater(rotate_orbit)

        self.play(FadeIn(orbiters, run_time=1.5), rate_func=smooth)
        self.add(tracker)

        # Phase 5: Zoom focus on RADAR (simulate by scaling)
        self.wait(3)
        zoom_group = VGroup(radar_group, orbiters)
        self.play(
            zoom_group.animate.scale(2.5).move_to(ORIGIN),
            FadeOut(title_halo, run_time=1.5),
            FadeOut(stars, run_time=1.5),
            run_time=3,
            rate_func=there_and_back
        )
        self.wait(2)