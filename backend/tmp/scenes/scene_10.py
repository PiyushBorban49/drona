
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene10(Scene):
    def construct(self):
        # Title
        title = Text("KMP – Efficient Pattern Matching", font_size=36, color=BLUE).to_edge(UP, buff=0.8)
        self.play(Write(title))
        self.wait(0.5)

        # Create Collage Elements
        # 1. State Machine / Highway Map Representation (Left)
        node_a = Circle(radius=0.3, color=BLUE, stroke_width=3).shift(LEFT * 4.5 + DOWN * 0.5)
        node_b = Circle(radius=0.3, color=BLUE, stroke_width=3).next_to(node_a, RIGHT, buff=0.8)
        node_c = Circle(radius=0.3, color=BLUE, stroke_width=3).next_to(node_b, RIGHT, buff=0.8)
        
        arrow_ab = Arrow(node_a.get_right(), node_b.get_left(), buff=0.1, color=GRAY)
        arrow_bc = Arrow(node_b.get_right(), node_c.get_left(), buff=0.1, color=GRAY)
        bypass_ca = CurvedArrow(node_c.get_top(), node_a.get_top(), angle=-PI/2, color=RED_D)
        
        map_group = VGroup(node_a, node_b, node_c, arrow_ab, arrow_bc, bypass_ca)
        map_label = Text("Skip Logic Map", font_size=14, color=GRAY).next_to(map_group, DOWN, buff=0.4)
        left_collage = VGroup(map_group, map_label)

        # 2. LPS Block (Center)
        lps_box_group = VGroup()
        lps_values = [0, 1, 0, 2, 3]
        for i, val in enumerate(lps_values):
            box = Square(side_length=0.45, stroke_width=2, stroke_color=GRAY)
            box.move_to(i * 0.45 * RIGHT)
            num = Text(str(val), font_size=16, color=GREEN)
            num.move_to(box.get_center())
            lps_box_group.add(VGroup(box, num))
        lps_box_group.move_to(DOWN * 0.5)
        lps_label = Text("LPS Lookup Table", font_size=14, color=GRAY).next_to(lps_box_group, DOWN, buff=0.4)
        center_collage = VGroup(lps_box_group, lps_label)

        # 3. Mini Code Block (Right)
        code_lines = VGroup(
            Line(LEFT*0.8, RIGHT*0.8, stroke_width=4, color=TEAL),
            Line(LEFT*0.6, RIGHT*0.4, stroke_width=4, color=WHITE).shift(DOWN*0.25),
            Line(LEFT*0.7, RIGHT*0.5, stroke_width=4, color=TEAL).shift(DOWN*0.5),
            Line(LEFT*0.4, RIGHT*0.6, stroke_width=4, color=WHITE).shift(DOWN*0.75)
        ).shift(RIGHT * 4.5 + DOWN * 0.2)
        code_label = Text("Linear Code", font_size=14, color=GRAY).next_to(code_lines, DOWN, buff=0.45)
        right_collage = VGroup(code_lines, code_label)

        # Fade in Collage
        self.play(FadeIn(left_collage), FadeIn(center_collage), FadeIn(right_collage))
        self.wait(2.5)

        # Fade out Collage to shift focus
        self.play(
            FadeOut(left_collage),
            FadeOut(center_collage),
            FadeOut(right_collage),
            title.animate.shift(UP * 0.2).set_color(WHITE)
        )
        self.wait(0.5)

        # Call-To-Action Button
        cta_btn = RoundedRectangle(corner_radius=0.18, width=4.5, height=1.1, stroke_color=GOLD, stroke_width=3, fill_color=GOLD_E, fill_opacity=0.2)
        cta_btn.move_to(DOWN * 0.5)
        cta_text = Text("Try it yourself!", font_size=26, color=WHITE)
        cta_text.move_to(cta_btn.get_center())
        
        cta_group = VGroup(cta_btn, cta_text)

        self.play(FadeIn(cta_group, target_position=DOWN*1.5))
        self.play(Indicate(cta_group, color=GOLD))
        self.wait(2.0)