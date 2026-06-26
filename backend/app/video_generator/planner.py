import os
import json
import asyncio
from typing import List, Dict, Any
from groq import AsyncGroq
from app.video_generator.prompts.prompts import PLANNER_PROMPT

async def plan_scenes(topic: str, api_key: str = None, model: str = 'openai/gpt-oss-120b') -> List[Dict[str, Any]]:
    groq_key = os.getenv('GROQ_API_KEY') or os.getenv('LLM_API_KEY') or api_key
    print(f"[Planner] Planning scenes for: {topic} using Groq SDK ({model})")

    if not groq_key:
        raise ValueError("Groq API key not found. Please set GROQ_API_KEY environment variable.")

    client = AsyncGroq(api_key=groq_key)
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": PLANNER_PROMPT},
                {"role": "user", "content": f"Topic: {topic}"}
            ],
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        full_content = chat_completion.choices[0].message.content
        
        print(f"[Planner] Request finished. Raw Content Length: {len(full_content)}")

        if not full_content:
            raise ValueError("Model returned empty response.")

        # The SDK handles basic cleaning, but we might still get markdown blocks if not careful
        cleaned_content = full_content.replace('```json', '').replace('```', '').strip()
        
        try:
            data = json.loads(cleaned_content)
            if isinstance(data, dict):
                # Handle cases like {"scenes": [...]} or {"data": {"scenes": [...]}}
                if 'scenes' in data:
                    return data['scenes']
                if 'data' in data and isinstance(data['data'], dict) and 'scenes' in data['data']:
                    return data['data']['scenes']
                # If it's a dict but no 'scenes' key, return values if they are a list
                for val in data.values():
                    if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
                        return val
            return data
        except json.JSONDecodeError as e:
            print(f"[Planner] JSON Parse Error. Content was: {cleaned_content}")
            raise e

    except Exception as error:
        print(f'[Planner] Groq SDK Error: {error}')
        raise error

