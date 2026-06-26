
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene4(Scene):
    def construct(self):
        self.camera.background_color = "#121214"
        
        # Title
        title = Text("Understanding LPS", font_size=40, color="#EAEAEF")
        sub_title = Text("Longest Proper Prefix that is also a Suffix", font_size=20, color="#00ADB5").next_to(title, DOWN, buff=0.2)
        title_group = VGroup(title, sub_title).to_edge(UP, buff=0.5)
        self.play(FadeIn(title_group, shift=UP * 0.3))
        
        # Word presentation
        word_str = "ABAB"
        word_mobjects = VGroup()
        for i, letter in enumerate(word_str):
            char_text = Text(letter, font_size=72, color="#EAEAEF", weight=BOLD)
            char_text.shift(RIGHT * i * 1.2)
            word_mobjects.add(char_text)
            
        word_mobjects.center().shift(UP * 0.2)
        self.play(
            LaggedStart(
                *[Write(char) for char in word_mobjects],
                lag_ratio=0.15
            ),
            run_time=1.5
        )
        self.wait(0.5)
        
        # Explain Prefix and Suffix visually with overlays
        # Prefix overlay: first "AB" (indices 0 and 1)
        prefix_rect = RoundedRectangle(width=2.1, height=1.4, corner_radius=0.15,
                                       fill_color="#00ADB5", fill_opacity=0.3, stroke_color="#00ADB5", stroke_width=3)
        prefix_rect.move_to(VGroup(word_mobjects[0], word_mobjects[1]).get_center())
        
        prefix_lbl = Text("Prefix: AB", font_size=20, color="#00ADB5").next_to(prefix_rect, UP, buff=0.3)
        
        # Suffix overlay: last "AB" (indices 2 and 3)
        suffix_rect = RoundedRectangle(width=2.1, height=1.4, corner_radius=0.15,
                                       fill_color="#F59E0B", fill_opacity=0.3, stroke_color="#F59E0B", stroke_width=3)
        suffix_rect.move_to(VGroup(word_mobjects[2], word_mobjects[3]).get_center())
        
        suffix_lbl = Text("Suffix: AB", font_size=20, color="#F59E0B").next_to(suffix_rect, DOWN, buff=0.3)
        
        # Animate overlays sliding from their respective edges
        self.play(
            FadeIn(prefix_rect, shift=DOWN * 0.3),
            FadeIn(prefix_lbl, shift=DOWN * 0.2)
        )
        self.wait(0.5)
        
        self.play(
            FadeIn(suffix_rect, shift=UP * 0.3),
            FadeIn(suffix_lbl, shift=UP * 0.2)
        )
        self.wait(1)
        
        # Highlight alignment / equality
        match_info = Text("Prefix == Suffix! Length = 2", font_size=24, color="#10B981").to_edge(DOWN, buff=1)
        self.play(Write(match_info))
        
        # Flash both overlays to show connection
        self.play(
            prefix_rect.animate.set_fill(color="#10B981", opacity=0.4),
            suffix_rect.animate.set_fill(color="#10B981", opacity=0.4),
            run_time=0.8
        )
        self.wait(2)