import os
import edge_tts
from typing import Optional
from app.config import get_settings

async def generate_tts(text: str, scene_number: int) -> Optional[str]:
    if not text or not text.strip():
        return None
        
    audio_dir = os.path.join(os.getcwd(), 'tmp', 'audio')
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)
        
    file_path = os.path.join(audio_dir, f'scene_{scene_number}.mp3')
    
    try:
        print(f"[TTS] Synthesizing narration for Scene {scene_number} using Edge TTS...")
        settings = get_settings()
        voice = settings.EDGE_TTS_VOICE or "en-US-ChristopherNeural"
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(file_path)
            
        return file_path.replace('\\', '/')
        
    except Exception as e:
        print(f"[TTS] ❌ Error generating audio for scene {scene_number}: {e}")
        return None

