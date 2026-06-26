
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene6(Scene):
    def construct(self):
        # Title
        title = Text("KMP Search – First Example", font_size=36, color=BLUE).to_edge(UP, buff=0.5)
        self.add(title)

        # Helper to create styled character grids
        def create_grid(text_str, cell_size=0.55):
            grid = VGroup()
            for i, char in enumerate(text_str):
                box = RoundedRectangle(corner_radius=0.1, width=cell_size*0.9, height=cell_size*0.9, stroke_width=2, stroke_color=GRAY_A)
                box.move_to(i * cell_size * RIGHT)
                lbl = Text(char, font_size=20, color=WHITE)
                lbl.move_to(box.get_center())
                grid.add(VGroup(box, lbl))
            return grid

        # Helper to align pattern grid with text grid index
        def shift_pattern_to(pat_grid, text_grid, k):
            shift_amount = text_grid[k].get_center()[0] - pat_grid[0].get_center()[0]
            return pat_grid.animate.shift(RIGHT * shift_amount)

        # Helper to highlight matching/mismatching cells
        def match_cells_anim(text_grid, pat_grid, t_idx, p_idx, success=True):
            color = "#2ECC71" if success else "#E74C3C"
            return AnimationGroup(
                text_grid[t_idx][0].animate.set_stroke(color=color, width=4),
                text_grid[t_idx][1].animate.set_color(color),
                pat_grid[p_idx][0].animate.set_stroke(color=color, width=4),
                pat_grid[p_idx][1].animate.set_color(color),
                run_time=0.25
            )

        # Helper to reset grid colors
        def reset_colors_anim(text_grid, pat_grid, t_indices, p_indices):
            anims = []
            for i in t_indices:
                anims.append(text_grid[i][0].animate.set_stroke(color=GRAY_A, width=2))
                anims.append(text_grid[i][1].animate.set_color(WHITE))
            for i in p_indices:
                anims.append(pat_grid[i][0].animate.set_stroke(color=GRAY_A, width=2))
                anims.append(pat_grid[i][1].animate.set_color(WHITE))
            return AnimationGroup(*anims, run_time=0.2)

        # Text and Pattern grids
        text_str = "ABABDABACDABABCABAB"
        pat_str = "ABABCABAB"
        
        text_grid = create_grid(text_str)
        text_grid.move_to(UP * 1.5)
        
        pat_grid = create_grid(pat_str)
        pat_grid.next_to(text_grid, DOWN, buff=1.2)
        pat_grid.align_to(text_grid, LEFT)

        # Labels
        text_label = Text("Text:", font_size=20, color=GRAY).next_to(text_grid, LEFT, buff=0.5)
        pat_label = Text("Pattern:", font_size=20, color=GRAY).next_to(pat_grid, LEFT, buff=0.5)

        self.play(FadeIn(text_grid), FadeIn(pat_grid), Write(text_label), Write(pat_label))
        self.wait(1)

        # Step 1: Align at 0
        # ABAB match, D vs C mismatch at 4
        for i in range(4):
            self.play(match_cells_anim(text_grid, pat_grid, i, i, True))
        self.play(match_cells_anim(text_grid, pat_grid, 4, 4, False))
        self.wait(0.5)

        # Reset colors and Shift to Text[2] (LPS[3] = 2 -> shift by 2)
        self.play(reset_colors_anim(text_grid, pat_grid, range(5), range(5)))
        self.play(shift_pattern_to(pat_grid, text_grid, 2))
        self.wait(0.5)

        # Step 2: Align at 2
        # A, B match. D vs A mismatch at 4
        self.play(match_cells_anim(text_grid, pat_grid, 2, 0, True))
        self.play(match_cells_anim(text_grid, pat_grid, 3, 1, True))
        self.play(match_cells_anim(text_grid, pat_grid, 4, 2, False))
        self.wait(0.5)

        # Reset and Shift to Text[4]
        self.play(reset_colors_anim(text_grid, pat_grid, range(2, 5), range(3)))
        self.play(shift_pattern_to(pat_grid, text_grid, 4))
        self.wait(0.5)

        # Step 3: Align at 4
        # D vs A mismatch
        self.play(match_cells_anim(text_grid, pat_grid, 4, 0, False))
        self.wait(0.3)
        self.play(reset_colors_anim(text_grid, pat_grid, [4], [0]))
        self.play(shift_pattern_to(pat_grid, text_grid, 5))
        self.wait(0.5)

        # Step 4: Align at 5
        # Matches A, B, A, mismatch at 8 (C vs B) -> "mismatch happens at position eight"
        self.play(match_cells_anim(text_grid, pat_grid, 5, 0, True))
        self.play(match_cells_anim(text_grid, pat_grid, 6, 1, True))
        self.play(match_cells_anim(text_grid, pat_grid, 7, 2, True))
        self.play(match_cells_anim(text_grid, pat_grid, 8, 3, False))
        self.wait(1.0)

        # LPS value shift explanation (LPS[2] = 1 -> shift pattern so Pat[1] aligns with Text[8], meaning Pat[0] aligns with Text[7])
        self.play(reset_colors_anim(text_grid, pat_grid, range(5, 9), range(4)))
        self.play(shift_pattern_to(pat_grid, text_grid, 7))
        self.wait(0.5)

        # Step 5: Align at 7
        self.play(match_cells_anim(text_grid, pat_grid, 7, 0, True))
        self.play(match_cells_anim(text_grid, pat_grid, 8, 1, False))
        self.wait(0.3)
        self.play(reset_colors_anim(text_grid, pat_grid, [7, 8], [0, 1]))
        self.play(shift_pattern_to(pat_grid, text_grid, 8))
        self.wait(0.3)

        # Step 6: Align at 8 (mismatch 8 vs 0) -> Shift to 9
        self.play(match_cells_anim(text_grid, pat_grid, 8, 0, False))
        self.wait(0.3)
        self.play(reset_colors_anim(text_grid, pat_grid, [8], [0]))
        self.play(shift_pattern_to(pat_grid, text_grid, 9))
        self.wait(0.3)

        # Step 7: Align at 9 (mismatch 9 vs 0) -> Shift to 10
        self.play(match_cells_anim(text_grid, pat_grid, 9, 0, False))
        self.wait(0.3)
        self.play(reset_colors_anim(text_grid, pat_grid, [9], [0]))
        self.play(shift_pattern_to(pat_grid, text_grid, 10))
        self.wait(0.5)

        # Step 8: Final Match at index 10
        success_anims = []
        for i in range(9):
            success_anims.append(match_cells_anim(text_grid, pat_grid, 10 + i, i, True))
        self.play(Succession(*success_anims))
        self.wait(0.5)

        # Flash success
        self.play(Indicate(pat_grid, color="#2ECC71"))
        
        match_msg = Text("Match Found at Index 10!", font_size=24, color="#2ECC71").next_to(pat_grid, DOWN, buff=0.6)
        self.play(FadeIn(match_msg))
        self.wait(2)