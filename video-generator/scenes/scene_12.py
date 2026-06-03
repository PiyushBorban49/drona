from manim import *
import numpy as np
import random

BG_COLOR = "#1b1d2b"
KURZGESAGT_ORANGE = "#E8834E"
KURZGESAGT_YELLOW = "#FFD166"
KURZGESAGT_BLUE = "#4A90D9"
KURZGESAGT_TEAL = "#06D6A0"
KURZGESAGT_RED = "#EF476F"
KURZGESAGT_PURPLE = "#7B2FBE"

class Scene12(Scene):
    def construct(self):
        self.add_sound("D:/fullStack/dronachrya/video-generator/output/audio/scene_12.mp3")
        self.camera.background_color = BG_COLOR
        
        bg_rect = Rectangle(fill_color=BG_COLOR, fill_opacity=1, stroke_width=0).scale(100)
        self.add(bg_rect)
        
        title = Text("Conclusion", color="#FFFFFF")
        self.play(FadeIn(title), run_time=1)
        
        techniques = [
            Text("Paging", color=KURZGESAGT_ORANGE),
            Text("Segmentation", color=KURZGESAGT_YELLOW),
            Text("Virtual Memory", color=KURZGESAGT_BLUE),
        ]
        
        for tech in techniques:
            self.play(FadeIn(tech), run_time=0.5)
            self.wait(0.5)
        
        for tech in techniques:
            self.play(FadeOut(tech), run_time=0.5)
        
        narration = Text("Memory management is a critical component of operating system design.", color="#FFFFFF")
        self.play(FadeIn(narration), run_time=1)
        self.wait(2)
        
        self.play(FadeOut(narration), run_time=1)
        
        final_thought = Text("The choice of memory management technique depends on the specific requirements of the system.", color="#FFFFFF")
        self.play(FadeIn(final_thought), run_time=1)
        self.wait(2)
        
        self.play(FadeOut(final_thought), run_time=1)
        
        conclusion = Text("In conclusion, memory management is crucial.", color="#FFFFFF")
        self.play(FadeIn(conclusion), run_time=1)
        self.wait(2)
        
        self.play(FadeOut(conclusion), run_time=1)
        
        self.wait(2)