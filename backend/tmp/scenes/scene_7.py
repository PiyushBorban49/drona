
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene7(Scene):
    def construct(self):
        # Title
        title = Text("KMP Search – Overlapping Matches", font_size=36, color=BLUE).to_edge(UP, buff=0.5)
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
        text_grid = create_grid("AAAAAAAA")
        text_grid.move_to(UP * 1.5)
        
        pat_grid = create_grid("AAAA")
        pat_grid.next_to(text_grid, DOWN, buff=1.2)
        pat_grid.align_to(text_grid, LEFT)

        # Labels
        text_label = Text("Text:", font_size=22, color=GRAY).next_to(text_grid, LEFT, buff=0.5)
        pat_label = Text("Pattern:", font_size=22, color=GRAY).next_to(pat_grid, LEFT, buff=0.5)

        self.play(FadeIn(text_grid), FadeIn(pat_grid), Write(text_label), Write(pat_label))
        self.wait(1)

        # Step 1: First Match (0 to 3)
        self.play(*[
            AnimationGroup(
                text_grid[i][0].animate.set_stroke(color="#2ECC71", width=4),
                text_grid[i][1].animate.set_color("#2ECC71"),
                pat_grid[i][0].animate.set_stroke(color="#2ECC71", width=4),
                pat_grid[i][1].animate.set_color("#2ECC71"),
            )
            for i in range(4)
        ], run_time=1.0)
        
        flash_rect = RoundedRectangle(corner_radius=0.1, width=4*0.65, height=0.65, stroke_color="#2ECC71", stroke_width=5).move_to(pat_grid.get_center())
        self.play(FadeIn(flash_rect))
        self.play(FadeOut(flash_rect))
        self.wait(1.0)

        # Overlapping shifts (1, 2, 3, 4)
        for step in range(1, 5):
            # Show shift
            self.play(
                # Keep previously matched overlapping segments green (LPS of AAAA is 3, so 3 chars overlap)
                *[text_grid[i][0].animate.set_stroke(color=GRAY_A, width=2) for i in range(step - 1, step)],
                *[text_grid[i][1].animate.set_color(WHITE) for i in range(step - 1, step)],
                shift_pattern_to(pat_grid, text_grid, step),
                run_time=0.8
            )
            # Instantly color overlapping 3 green, check the 4th
            overlap_anims = []
            for o in range(3):
                overlap_anims.append(pat_grid[o][0].animate.set_stroke(color="#2ECC71", width=4))
                overlap_anims.append(pat_grid[o][1].animate.set_color("#2ECC71"))
                overlap_anims.append(text_grid[step + o][0].animate.set_stroke(color="#2ECC71", width=4))
                overlap_anims.append(text_grid[step + o][1].animate.set_color("#2ECC71"))
            self.play(*overlap_anims, run_time=0.4)

            # Compare the next (last) character
            self.play(
                pat_grid[3][0].animate.set_stroke(color="#2ECC71", width=4),
                pat_grid[3][1].animate.set_color("#2ECC71"),
                text_grid[step + 3][0].animate.set_stroke(color="#2ECC71", width=4),
                text_grid[step + 3][1].animate.set_color("#2ECC71"),
                run_time=0.4
            )
            
            # Tiny success pulse
            self.play(Indicate(pat_grid, color="#2ECC71", scale_factor=1.05), run_time=0.4)
            self.wait(0.5)

        self.wait(1.5)