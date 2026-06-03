"""
Dronacharya v3 — Audio Ingestion Agent
Transcribes and synthesizes knowledge from podcasts and audio files using Groq Whisper.
"""
import os
from typing import List, Dict, Optional
from groq import Groq
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.config import get_settings

def get_groq_client():
    """Lazily initialize Groq client using settings."""
    settings = get_settings()
    return Groq(api_key=settings.GROQ_API_KEY)

async def transcribe_audio(file_path: str) -> str:
    """Transcribe audio using Groq Whisper API."""
    try:
        client = get_groq_client()
        with open(file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(file_path), file.read()),
                model="distil-whisper-large-v3-en",
                response_format="text",
                language="en"
            )
        return transcription
    except Exception as e:
        print(f"Audio transcription error: {e}")
        return ""

async def synthesize_audio_content(title: str, transcript: str) -> Dict:
    """Use AI to synthesize audio transcript into structured knowledge."""
    if not transcript:
        return {"summary": "Transcription failed.", "concepts": [], "key_points": []}

    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert audio analyst. Synthesize the following podcast/audio transcript into a concise overview, key concepts, and main takeaways. Return valid JSON."),
        ("user", "Title: {title}\n\nTranscript:\n{transcript}\n\nReturn JSON: {{ 'summary': '...', 'concepts': [{{ 'title': '...', 'description': '...' }}], 'key_points': ['...', '...'] }}")
    ])

    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke({"title": title, "transcript": transcript[:15000]})
    except Exception as e:
        print(f"Audio synthesis error: {e}")
        return {"summary": "Audio analysis failed.", "concepts": []}

async def process_audio_file(file_path: str, title: str = "Audio Upload") -> Dict:
    """Main orchestration for Audio ingestion."""
    transcript = await transcribe_audio(file_path)
    if not transcript:
        return {"success": False, "error": "Transcription failed."}

    analysis = await synthesize_audio_content(title, transcript)
    
    return {
        "success": True,
        "title": title,
        "analysis": analysis,
        "full_transcript": transcript[:1000] # Preview
    }
