
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)


class Scene5(Scene):
    def construct(self):
        self.camera.background_color = "#121214"
        
        # Title
        title = Text("Building the LPS Array", font_size=36, color="#EAEAEF")
        title.to_edge(UP, buff=0.4)
        self.play(FadeIn(title, shift=UP * 0.3))
        
        # Input pattern: ABABCABAB
        pattern_str = "ABABCABAB"
        
        # Track calculations
        # LPS values: [0, 0, 1, 2, 0, 1, 2, 3, 4]
        lps_values = [0, 0, 1, 2, 0, 1, 2, 3, 4]
        
        # Draw String Boxes
        str_boxes = VGroup()
        for i, char in enumerate(pattern_str):
            box = Square(side_length=0.6, stroke_color="#00ADB5", stroke_width=2)
            lbl = Text(char, font_size=22, color="#EAEAEF")
            lbl.move_to(box.get_center())
            cell = VGroup(box, lbl)
            cell.shift(RIGHT * i * 0.65)
            str_boxes.add(cell)
            
        str_boxes.center().shift(UP * 1.2)
        str_label = Text("Pattern:", font_size=18, color="#00ADB5").next_to(str_boxes, LEFT, buff=0.4)
        
        self.play(FadeIn(str_label), FadeIn(str_boxes))
        
        # Draw Empty LPS Array Boxes Below
        lps_boxes = VGroup()
        lps_mobs = []  # save references to update them
        for i in range(len(pattern_str)):
            box = Square(side_length=0.6, stroke_color="#F59E0B", stroke_width=2, fill_opacity=0.05)
            # empty text block placeholder
            lbl = Text("", font_size=22, color="#F59E0B")
            lbl.move_to(box.get_center())
            cell = VGroup(box, lbl)
            cell.shift(RIGHT * i * 0.65)
            lps_boxes.add(cell)
            lps_mobs.append(lbl)
            
        lps_boxes.center().shift(UP * 0.0)
        lps_label = Text("LPS:", font_size=18, color="#F59E0B").next_to(lps_boxes, LEFT, buff=0.4)
        
        self.play(FadeIn(lps_label), FadeIn(lps_boxes))
        self.wait(0.5)
        
        # Cursor pointer to track current index
        cursor = Triangle(fill_opacity=1, stroke_width=0, fill_color="#FF2E63").scale(0.12)
        cursor.rotate(PI) # point downwards
        
        # Start sequence simulation (we will highlight each box as we compute)
        for idx in range(len(pattern_str)):
            # Target box
            target_box = lps_boxes[idx][0]
            
            # Reposition indicator cursor above string box
            cursor_pos = str_boxes[idx].get_top() + UP * 0.25
            if idx == 0:
                cursor.move_to(cursor_pos)
                self.play(FadeIn(cursor))
            else:
                self.play(cursor.animate.move_to(cursor_pos), run_time=0.4)
                
            # Highlight current computation cell
            self.play(
                target_box.animate.set_fill(color="#F59E0B", opacity=0.35),
                run_time=0.2
            )
            
            # Fill value
            val_text = Text(str(lps_values[idx]), font_size=22, color="#EAEAEF", weight=BOLD)
            val_text.move_to(target_box.get_center())
            
            self.play(FadeIn(val_text, scale=0.5), run_time=0.4)
            
            # Revert highlighting slightly
            self.play(
                target_box.animate.set_fill(color="#F59E0B", opacity=0.1),
                run_time=0.2
            )
            
        self.play(FadeOut(cursor))
        self.wait(0.5)
        
        # Final Showcase of completed array
        completion_lbl = Text("Completed LPS Table!", font_size=24, color="#10B981").to_edge(DOWN, buff=1)
        self.play(Write(completion_lbl))
        
        # Flash the entire finished array
        self.play(
            *[box[0].animate.set_stroke(color="#10B981", width=3) for box in lps_boxes],
            run_time=1
        )
        self.wait(2)