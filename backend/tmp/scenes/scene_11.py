from manim import *

class Scene11(Scene):
    def construct(self):
        # Code setup
        code_str = """def compute_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        else:
            if length != 0:
                length = lps[length - 1]
            else:
                lps[i] = 0
                i += 1
    return lps"""

        title = Text("Python Implementation Walkthrough", font_size=36, color=BLUE_B)
        title.to_edge(UP, buff=0.4)
        self.add(title)

        # Code block on the left side
        code_block = Code(
            code=code_str,
            tab_width=4,
            background="window",
            language="Python",
            font="Monospace"
        ).scale(0.8)
        code_block.to_edge(LEFT, buff=0.5).shift(DOWN * 0.2)
        
        self.play(Write(code_block))
        self.wait(1)

        # Highlight box helper
        def get_highlight_box(line_num_start, line_num_end=None):
            if line_num_end is None:
                line_num_end = line_num_start
            
            # Extract target lines coordinates
            target_lines = code_block.code[line_num_start:line_num_end+1]
            surrounding_box = SurroundingRectangle(target_lines, color=TEAL, stroke_width=2, buff=0.08)
            return surrounding_box

        # Overlay explanations on the right side
        explanation_box = RoundedRectangle(corner_radius=0.1, color=GRAY_A, fill_opacity=0.1, width=5.5, height=4.5)
        explanation_box.to_edge(RIGHT, buff=0.5).shift(DOWN * 0.2)
        
        self.play(FadeIn(explanation_box))

        def update_explanation(text_lines):
            expl_group = VGroup()
            for idx, text in enumerate(text_lines):
                line = Text(text, font_size=20, color=WHITE)
                if idx > 0:
                    line.next_to(expl_group[-1], DOWN, aligned_edge=LEFT, buff=0.15)
                else:
                    line.move_to(explanation_box.get_top() + DOWN * 0.5)
                expl_group.add(line)
            return expl_group

        # 1. Function definition & setup
        box1 = get_highlight_box(0, 3)
        text1 = update_explanation([
            "Initialize LPS array with zeros.",
            "Set match tracker length = 0.",
            "Iterate pointer 'i' starting",
            "from index 1."
        ])
        
        self.play(Create(box1), FadeIn(text1))
        self.wait(3.5)

        # 2. When characters match
        box2 = get_highlight_box(5, 8)
        text2 = update_explanation([
            "If characters match:",
            "  1. Increase prefix length",
            "  2. Assign it to lps[i]",
            "  3. Advance 'i' pointer"
        ])

        self.play(
            ReplacementTransform(box1, box2),
            ReplacementTransform(text1, text2)
        )
        self.wait(3.5)

        # 3. Handling mismatch (backtracking length)
        box3 = get_highlight_box(10, 11)
        text3 = update_explanation([
            "If characters mismatch and",
            "length is not 0:",
            "Backtrack 'length' utilizing",
            "previously computed LPS value."
        ])

        self.play(
            ReplacementTransform(box2, box3),
            ReplacementTransform(text2, text3)
        )
        self.wait(3.5)

        # 4. Fallback when length is 0
        box4 = get_highlight_box(12, 14)
        text4 = update_explanation([
            "If length is 0 and no match:",
            "  - lps[i] is set to 0",
            "  - Advance 'i' pointer"
        ])

        self.play(
            ReplacementTransform(box3, box4),
            ReplacementTransform(text3, text4)
        )
        self.wait(3.5)

        # Finish clean-up
        self.play(
            FadeOut(box4),
            FadeOut(text4)
        )
        self.wait(1)