
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene8(Scene):
    def construct(self):
        # Title
        title = Text("KMP Search – Partial Overlap", font_size=36, color=BLUE).to_edge(UP, buff=0.5)
        self.add(title)

        # Helper to create styled character grids
        def create_grid(text_str, cell_size=0.65):
            grid = VGroup()
            for i, char in enumerate(text_str):
                box = RoundedRectangle(corner_radius=0.1, width=cell_size*0.9, height=cell_size*0.9, stroke_width=2, stroke_color=GRAY_A)
                box.move_to(i * cell_size * RIGHT)
                lbl = Text(char, font_size=24, color=WHITE)
                lbl.move_to(box.get_center())
                grid.add(VGroup(box, lbl))
            return grid

        # Helper to align pattern grid with text grid index
        def shift_pattern_to(pat_grid, text_grid, k):
            shift_amount = text_grid[k].get_center()[0] - pat_grid[0].get_center()[0]
            return pat_grid.animate.shift(RIGHT * shift_amount)

        # Grids
        text_grid = create_grid("ABABABCAB")
        text_grid.move_to(UP * 1.5)
        
        pat_grid = create_grid("ABC")
        pat_grid.next_to(text_grid, DOWN, buff=1.2)
        pat_grid.align_to(text_grid, LEFT)

        # Labels
        text_label = Text("Text:", font_size=22, color=GRAY).next_to(text_grid, LEFT, buff=0.5)
        pat_label = Text("Pattern:", font_size=22, color=GRAY).next_to(pat_grid, LEFT, buff=0.5)

        self.play(FadeIn(text_grid), FadeIn(pat_grid), Write(text_label), Write(pat_label))
        self.wait(1)

        # Step 1: Align at 0 (A vs A, B vs B, A vs C -> mismatch at 2)
        self.play(
            text_grid[0][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[0][1].animate.set_color("#2ECC71"),
            pat_grid[0][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[0][1].animate.set_color("#2ECC71"),
            run_time=0.4
        )
        self.play(
            text_grid[1][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[1][1].animate.set_color("#2ECC71"),
            pat_grid[1][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[1][1].animate.set_color("#2ECC71"),
            run_time=0.4
        )
        self.play(
            text_grid[2][0].animate.set_stroke(color="#E74C3C", width=4),
            text_grid[2][1].animate.set_color("#E74C3C"),
            pat_grid[2][0].animate.set_stroke(color="#E74C3C", width=4),
            pat_grid[2][1].animate.set_color("#E74C3C"),
            run_time=0.4
        )
        self.wait(0.8)

        # Reset and shift to 2
        self.play(
            *[text_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(3)],
            *[text_grid[i][1].animate.set_color(WHITE) for i in range(3)],
            *[pat_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(3)],
            *[pat_grid[i][1].animate.set_color(WHITE) for i in range(3)],
            run_time=0.3
        )
        self.play(shift_pattern_to(pat_grid, text_grid, 2))
        self.wait(0.5)

        # Step 2: Align at 2 (A vs A, B vs B, A vs C -> mismatch at 4)
        self.play(
            text_grid[2][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[2][1].animate.set_color("#2ECC71"),
            pat_grid[0][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[0][1].animate.set_color("#2ECC71"),
            run_time=0.4
        )
        self.play(
            text_grid[3][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[3][1].animate.set_color("#2ECC71"),
            pat_grid[1][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[1][1].animate.set_color("#2ECC71"),
            run_time=0.4
        )
        self.play(
            text_grid[4][0].animate.set_stroke(color="#E74C3C", width=4),
            text_grid[4][1].animate.set_color("#E74C3C"),
            pat_grid[2][0].animate.set_stroke(color="#E74C3C", width=4),
            pat_grid[2][1].animate.set_color("#E74C3C"),
            run_time=0.4
        )
        self.wait(0.8)

        # Reset and shift to 4
        self.play(
            *[text_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(2, 5)],
            *[text_grid[i][1].animate.set_color(WHITE) for i in range(2, 5)],
            *[pat_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(3)],
            *[pat_grid[i][1].animate.set_color(WHITE) for i in range(3)],
            run_time=0.3
        )
        self.play(shift_pattern_to(pat_grid, text_grid, 4))
        self.wait(0.5)

        # Step 3: Align at 4 (A vs A, B vs B, A vs C -> mismatch at 6)
        self.play(
            text_grid[4][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[4][1].animate.set_color("#2ECC71"),
            pat_grid[0][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[0][1].animate.set_color("#2ECC71"),
            run_time=0.3
        )
        self.play(
            text_grid[5][0].animate.set_stroke(color="#2ECC71", width=4),
            text_grid[5][1].animate.set_color("#2ECC71"),
            pat_grid[1][0].animate.set_stroke(color="#2ECC71", width=4),
            pat_grid[1][1].animate.set_color("#2ECC71"),
            run_time=0.3
        )
        self.play(
            text_grid[6][0].animate.set_stroke(color="#E74C3C", width=4),
            text_grid[6][1].animate.set_color("#E74C3C"),
            pat_grid[2][0].animate.set_stroke(color="#E74C3C", width=4),
            pat_grid[2][1].animate.set_color("#E74C3C"),
            run_time=0.3
        )
        self.wait(0.8)

        # Reset and shift to 6
        self.play(
            *[text_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(4, 7)],
            *[text_grid[i][1].animate.set_color(WHITE) for i in range(4, 7)],
            *[pat_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(3)],
            *[pat_grid[i][1].animate.set_color(WHITE) for i in range(3)],
            run_time=0.3
        )
        self.play(shift_pattern_to(pat_grid, text_grid, 6))
        self.wait(0.5)

        # Step 4: Final Match (ABC vs ABC) -> Gold Glow!
        self.play(
            *[
                AnimationGroup(
                    text_grid[6+i][0].animate.set_stroke(color="#F1C40F", width=5),
                    text_grid[6+i][1].animate.set_color("#F1C40F"),
                    pat_grid[i][0].animate.set_stroke(color="#F1C40F", width=5),
                    pat_grid[i][1].animate.set_color("#F1C40F")
                )
                for i in range(3)
            ],
            run_time=1.2
        )
        self.play(Indicate(pat_grid, color="#F1C40F"), run_time=0.8)
        self.wait(1.5)