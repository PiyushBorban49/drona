
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

class Scene2(Scene):
    def construct(self):
        # Phase 1: Background & starfield
        self.camera.background_color = BG_DARK

        stars = VGroup()
        for _ in range(80):
            star = Dot(
                point=np.array([random.uniform(-7.5, 7.5), random.uniform(-4.5, 4.5), 0]),
                radius=random.uniform(0.01, 0.04),
                color=WHITE,
                fill_opacity=random.uniform(0.2, 0.7),
            )
            stars.add(star)
        self.add(stars)

        grid = NumberPlane(
            background_line_style={"stroke_color": SOFT_WHITE, "stroke_opacity": 0.07},
            axis_config={"stroke_opacity": 0},
        )
        grid.shift(LEFT * 14)  # start off-screen left
        self.add(grid)

        self.play(grid.animate.shift(RIGHT * 14), run_time=1, rate_func=smooth)

        # Phase 2: Character string progressive reveal
        raw_string = "B A N A N A N A"
        chars = raw_string.split()
        char_mobs = VGroup()
        for i, ch in enumerate(chars):
            txt = Text(ch, font="Courier", color=SOFT_WHITE, font_size=48)
            char_mobs.add(txt)
        char_mobs.arrange(buff=0.3)
        char_mobs.move_to(ORIGIN)

        self.play(
            LaggedStart(
                *[FadeIn(c, shift=UP * 0.2) for c in char_mobs],
                lag_ratio=0.15,
            ),
            run_time=3,
        )

        # Phase 3: Highlight all substrings with expanding rectangles
        substr_rects = VGroup()
        for start in range(len(chars)):
            for end in range(start + 1, len(chars) + 1):
                sub = char_mobs[start:end]
                rect = Rectangle(
                    width=sub.width + 0.2,
                    height=sub.height + 0.2,
                    color=ORANGE,
                    fill_color=ORANGE,
                    fill_opacity=0.15,
                    stroke_width=0,
                )
                rect.move_to(sub.get_center())
                rect.set_width(0, stretch=True)
                substr_rects.add(rect)
                self.add(rect)

        rect_animations = []
        for rect in substr_rects:
            rect_animations.append(
                rect.animate.set_width(rect.width, stretch=True, rate_func=linear)
            )
        self.play(
            LaggedStart(*rect_animations, lag_ratio=0.02),
            run_time=6,
        )

        # Phase 4: Red timer counts up
        timer = DecimalNumber(
            0,
            num_decimal_places=0,
            include_sign=False,
            unit=" ms",
            font_size=36,
            color=RED,
        )
        timer.to_corner(UR).shift(DOWN * 0.5 + LEFT * 0.5)
        self.add(timer)

        self.play(
            timer.animate.set_value(4000),
            run_time=4,
            rate_func=linear,
        )

        # Phase 5: Text overlay reveal
        overlay = Text(
            "O(n²) brute force",
            font="Courier",
            color=RED,
            font_size=44,
        )
        overlay.next_to(char_mobs, DOWN, buff=0.8)

        self.play(FadeIn(overlay, shift=UP * 0.3), run_time=2)

        # Phase 6: Hold with ambient motion
        self.wait(2)