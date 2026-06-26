
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene9(Scene):
    def construct(self):
        # Code Editor Window
        editor_bg = RoundedRectangle(corner_radius=0.15, width=9.0, height=6.2, fill_color="#1E1E1E", fill_opacity=1, stroke_color=GRAY_D)
        editor_bg.shift(LEFT * 1.8)
        
        # OS Dots
        red_dot = Circle(radius=0.1, color="#E74C3C", fill_opacity=1).move_to(editor_bg.get_corner(UL) + RIGHT*0.4 + DOWN*0.4)
        yellow_dot = Circle(radius=0.1, color="#F1C40F", fill_opacity=1).next_to(red_dot, RIGHT, buff=0.12)
        green_dot = Circle(radius=0.1, color="#2ECC71", fill_opacity=1).next_to(yellow_dot, RIGHT, buff=0.12)
        
        title = Text("kmp_search.py", font_size=14, color=GRAY).next_to(green_dot, RIGHT, buff=0.4)

        # Lines of Code
        markup_lines = [
            "<span color='#C586C0'>def</span> <span color='#DCDCAA'>kmp_search</span>(text, pattern):",
            "    lps = <span color='#DCDCAA'>compute_lps</span>(pattern)",
            "    i = j = <span color='#B5CEA8'>0</span>",
            "<span color='#C586C0'>    while</span> i &lt; <span color='#4EC9B0'>len</span>(text):",
            "<span color='#C586C0'>        if</span> pattern[j] == text[i]:",
            "            i += <span color='#B5CEA8'>1</span>; j += <span color='#B5CEA8'>1</span>",
            "<span color='#C586C0'>        if</span> j == <span color='#4EC9B0'>len</span>(pattern):",
            "            <span color='#C586C0'>return</span> i - j",
            "<span color='#C586C0'>        elif</span> i &lt; <span color='#4EC9B0'>len</span>(text) <span color='#C586C0'>and</span> pattern[j] != text[i]:",
            "<span color='#C586C0'>            if</span> j != <span color='#B5CEA8'>0</span>:",
            "                j = lps[j-<span color='#B5CEA8'>1</span>]",
            "<span color='#C586C0'>            else</span>:",
            "                i += <span color='#B5CEA8'>1</span>"
        ]

        code_group = VGroup(*[MarkupText(line, font_size=13, font="Courier New") for line in markup_lines])
        code_group.arrange(DOWN, aligned_edge=LEFT, buff=0.16)
        code_group.move_to(editor_bg.get_center() + DOWN*0.1 + LEFT*0.2)

        self.play(FadeIn(editor_bg), FadeIn(red_dot), FadeIn(yellow_dot), FadeIn(green_dot), FadeIn(title))
        self.play(Write(code_group), run_time=2.0)
        self.wait(0.5)

        # Watch Panel
        watch_bg = RoundedRectangle(corner_radius=0.1, width=3.2, height=4.5, fill_color="#252526", fill_opacity=1, stroke_color=GRAY_D)
        watch_bg.shift(RIGHT * 4.8)
        watch_title = Text("Variables", font_size=18, color=BLUE).next_to(watch_bg.get_top(), DOWN, buff=0.3)
        
        # Clock Icon
        clock_circle = Circle(radius=0.2, color=YELLOW, stroke_width=2.5)
        clock_hand1 = Line(ORIGIN, UP*0.14, stroke_width=2.5, color=YELLOW)
        clock_hand2 = Line(ORIGIN, RIGHT*0.1, stroke_width=2.5, color=YELLOW)
        clock_icon = VGroup(clock_circle, clock_hand1, clock_hand2).next_to(watch_bg.get_top(), DOWN, buff=1.0).shift(LEFT * 0.8)
        i_text = Text("i: Text Index", font_size=14, color=WHITE).next_to(clock_icon, RIGHT, buff=0.3)

        # Road Sign / LPS Arrow Icon
        arrow_body = Line(DOWN*0.15, UP*0.15, stroke_width=3, color=GREEN)
        arrow_head = Arrow(DOWN*0.15, UP*0.15, stroke_width=3, color=GREEN, max_tip_length_to_length_ratio=0.5)
        sign_box = Square(side_length=0.3, stroke_width=2.5, color=GREEN).rotate(PI/4)
        lps_icon = VGroup(sign_box, arrow_head).next_to(clock_icon, DOWN, buff=1.0)
        lps_text = Text("lps: Skip Array", font_size=14, color=WHITE).next_to(lps_icon, RIGHT, buff=0.3)

        self.play(FadeIn(watch_bg), FadeIn(watch_title))
        self.play(Create(clock_icon), Write(i_text))
        self.play(Create(lps_icon), Write(lps_text))
        self.wait(1)

        # Highlighter Box for code lines
        highlighter = RoundedRectangle(corner_radius=0.05, stroke_color=TEAL, stroke_width=1.5, fill_color=TEAL, fill_opacity=0.15)
        highlighter.match_width(code_group)
        highlighter.stretch_to_fit_height(code_group[0].height + 0.08)
        highlighter.move_to(code_group[0].get_center())

        self.play(FadeIn(highlighter))
        self.wait(0.5)

        # Walk-through line steps
        steps = [1, 2, 3, 4, 8, 9, 10]
        for line_num in steps:
            self.play(highlighter.animate.move_to(code_group[line_num].get_center()), run_time=0.6)
            self.wait(0.8)

        self.play(FadeOut(highlighter))
        self.wait(1.5)