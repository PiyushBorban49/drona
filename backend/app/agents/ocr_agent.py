"""
Dronacharya v3 — OCR Ingestion Agent
Extracts text from handwritten notes and images using Groq Llama-Vision.
"""
import os
import base64
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

def encode_image(image_path: str) -> str:
    """Encode image to base64."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

async def extract_text_vision(image_path: str) -> str:
    """Extract text from image using Groq Llama 3.2 Vision."""
    try:
        client = get_groq_client()
        base64_image = encode_image(image_path)
        
        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this image, especially handwritten notes. Provide a clean transcription."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OCR Vision error: {e}")
        return ""

async def synthesize_ocr_content(text: str) -> Dict:
    """Use AI to synthesize OCR text into structured knowledge."""
    if not text:
        return {"summary": "OCR failed.", "concepts": [], "key_points": []}

    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert researcher. Synthesize the following raw OCR text (potentially from handwritten notes) into a concise overview and structured concepts. Return valid JSON."),
        ("user", "Text:\n{text}\n\nReturn JSON: {{ 'summary': '...', 'concepts': [{{ 'title': '...', 'description': '...' }}], 'key_points': ['...', '...'] }}")
    ])

    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke({"text": text[:10000]})
    except Exception as e:
        print(f"OCR synthesis error: {e}")
        return {"summary": "OCR analysis failed.", "concepts": []}

async def process_ocr_image(image_path: str) -> Dict:
    """Main orchestration for OCR ingestion."""
    text = await extract_text_vision(image_path)
    if not text:
        return {"success": False, "error": "Transcription failed."}

    analysis = await synthesize_ocr_content(text)
    
    return {
        "success": True,
        "analysis": analysis,
        "raw_text": text[:500] # Preview
    }
