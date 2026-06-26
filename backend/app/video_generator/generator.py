import os
import json
import asyncio
import re
from typing import Dict, Any, Optional,List
from google import genai
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from groq import AsyncGroq
from app.video_generator.prompts.prompts import CODER_PROMPT, BATCH_CODER_PROMPT

# ... (existing code up to generate_manim_code)

async def generate_batch_manim_code(scenes: List[Dict[str, Any]], config: Dict[str, Any]) -> tuple[Dict[int, str], Optional[str]]:
    """Generates code for multiple scenes in a single request. Returns (results, error_message)."""
    user_model = os.getenv('USER_MODEL') or config.get('model')
    user_api_key = os.getenv('USER_API_KEY') or config.get('apiKey')
    display_model = user_model or 'gemini-3.5-flash'
    print("GENERATOR")
    print("user_model : ",user_model)
    print("user_api_key : ",user_api_key)
    print("display_model : ",display_model)
    print(f"[Generator] 📦 Attempting Batch Generation for {len(scenes)} scenes with {display_model}")

    input_prompt = f"{BATCH_CODER_PROMPT}\n\n[SCENE PLANS]:\n{json.dumps(scenes)}"
    
    full_response = ""
    # Retry mechanism for 503s
    max_batch_retries = 2
    batch_attempt = 0
    last_error = None
    
    while batch_attempt <= max_batch_retries:
        try:
            # Default Gemini 
            if not user_model or user_model.startswith('gemini'):
                google_key = os.getenv('GOOGLE_API_KEY') or user_api_key
                if not google_key:
                    raise ValueError("GOOGLE_API_KEY not found.")
                client = genai.Client(api_key=google_key)
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model='gemini-3.5-flash',
                    contents=input_prompt
                )
                full_response = response.text
            
            # Groq (Llama, GPT-OSS, etc.)
            else:
                groq_key = os.getenv('GROQ_API_KEY') or user_api_key
                if not groq_key:
                     raise ValueError("Groq API key not found.")
                client = AsyncGroq(api_key=groq_key)
                response = await client.chat.completions.create(
                    model=user_model,
                    messages=[{"role": "user", "content": input_prompt}],
                    temperature=0.2
                )
                full_response = response.choices[0].message.content
            
            # If we got here, success!
            last_error = None
            break

        except Exception as e:
            batch_attempt += 1
            last_error = str(e)
            if "503" in str(e) and batch_attempt <= max_batch_retries:
                wait_time = batch_attempt * 3
                print(f"[Generator] ⚠️ Gemini 503 (High Demand). Retrying batch in {wait_time}s... (Attempt {batch_attempt}/{max_batch_retries})")
                await asyncio.sleep(wait_time)
                continue
            
            print(f"[Generator] ❌ Batch generation failed: {e}")
            return {}, clean_error_message(e)

    # Parsing
    try:
        results = {}
        # Clean markdown if present
        clean_response = re.sub(r'```python\s*|```', '', full_response)
        
        # Split by delimiter: # --- BATCH_SCENE_START [N] ---
        segments = re.split(r'#\s*---\s*BATCH_SCENE_START\s*\[?(\d+)\]?\s*---', clean_response)
        
        # segments will be [preamble, scene_num, content, scene_num, content, ...]
        for i in range(1, len(segments), 2):
            scene_num = int(segments[i])
            content = segments[i+1].strip()
            if content:
                # Use save_code but we need to handle the case where it might fail
                file_path = save_code(scene_num, content)
                results[scene_num] = file_path
        
        if not results:
             return {}, "AI response could not be parsed into scenes. The model might have failed to follow the formatting instructions or the output was truncated."
             
        return results, None
    except Exception as parse_error:
        print(f"[Generator] ❌ Failed to parse batch response: {parse_error}")
        return {}, f"Batch Parsing Error: {str(parse_error)}"


def clean_error_message(error: Any) -> str:
    """Extracts a user-friendly message from typical AI SDK errors."""
    err_str = str(error)
    
    if "503" in err_str:
        return "AI Model is currently in high demand (503). Please try again in a few minutes."
    
    if "429" in err_str:
        # Check for Gemini's specific quota message
        if "Quota exceeded" in err_str:
             return "AI API Quota Exceeded (429). Please check your billing or try again later."
        return "Too many requests (429). Please slow down."
        
    if "401" in err_str or "403" in err_str:
        return "Authentication failed (401/403). Check your API keys."
        
    # Default: Try to extract the message if it's a JSON string from Gemini
    try:
        # If it looks like a dictionary string
        if '{' in err_str and 'message' in err_str:
            import ast
            # Basic attempt to find the message field
            match = re.search(r"'message':\s*'([^']*)'", err_str)
            if match:
                return match.group(1)
    except:
        pass
        
    # Return a truncated version if it's too long
    return f"AI Generation failed: {err_str[:100]}..."

# Output dir logic for backend integration
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

async def generate_manim_code(scene_plan: Dict[str, Any], config: Dict[str, Any], last_error: Optional[str] = None, last_code: Optional[str] = None) -> str:
    user_model = os.getenv('USER_MODEL') or config.get('model')
    user_api_key = os.getenv('USER_API_KEY') or config.get('apiKey')
    groq_key = os.getenv('GROQ_API_KEY') or os.getenv('LLM_API_KEY')
    
    is_custom_request = bool(user_model and user_api_key)
    display_model = user_model or 'gemini-3.5-flash'
    
    scene_num = scene_plan.get('scene_number', 'unknown')
    print(f"[Generator] 🚀 Attempting Scene {scene_num} with {display_model}")

    input_prompt = f"{CODER_PROMPT}\n\n[SCENE PLAN]:\n{json.dumps(scene_plan)}"

    if last_error and last_code:
        print(f"[Generator] ⚠️ Injecting previous render error for self-correction...")
        input_prompt += f"\n\n[PREVIOUS CODE]:\n{last_code}\n\n[CRITICAL ERROR DURING RENDERING]:\n{last_error}\n\nFIX THIS ERROR. Output only the corrected Python code. Use only standard Manim Community classes. Do not use custom classes like 'Gear' unless you define them."

    full_code = ""

    try:
        if is_custom_request:
            # OpenAI
            if user_model.startswith('gpt'):
                client = AsyncOpenAI(api_key=user_api_key)
                response = await client.chat.completions.create(
                    model=user_model,
                    messages=[{"role": "user", "content": input_prompt}],
                    temperature=0.2
                )
                full_code = response.choices[0].message.content
            
            # Anthropic
            elif user_model.startswith('claude'):
                client = AsyncAnthropic(api_key=user_api_key)
                # Ensure we use a valid model name if the user provided a prefix
                anthropic_model = user_model if '-' in user_model else 'claude-3-5-sonnet'
                response = await client.messages.create(
                    model=anthropic_model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": input_prompt}],
                    temperature=0.2
                )
                full_code = response.content[0].text
            
            # Google Gemini
            elif user_model.startswith('gemini'):
                client = genai.Client(api_key=user_api_key)
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=user_model,
                    contents=input_prompt
                )
                full_code = response.text
            
            # Groq / Other (including gpt-oss-120b)
            else:
                client = AsyncGroq(api_key=user_api_key or groq_key)
                response = await client.chat.completions.create(
                    model=user_model,
                    messages=[{"role": "user", "content": input_prompt}],
                    temperature=0.2
                )
                full_code = response.choices[0].message.content
        
        else:
            # Default Gemini
            google_key = os.getenv('GOOGLE_API_KEY')
            if not google_key:
                raise ValueError("GOOGLE_API_KEY not found for default model.")
            client = genai.Client(api_key=google_key)
            response = await asyncio.to_thread(
                client.models.generate_content,
                model='gemini-3.5-flash',
                contents=input_prompt
            )
            full_code = response.text

        if not full_code or len(full_code.strip()) < 100:
            raise ValueError("Response too short — likely truncated.")

        return save_code(scene_num, full_code)

    except Exception as api_error:
        print(f"[Generator] Primary API failed ({api_error}). Falling back to Groq SDK...")
        
        if not groq_key:
             print("[Generator] ❌ Fallback failed: Groq API key missing.")
             raise api_error

        client = AsyncGroq(api_key=groq_key)
        try:
            chat_completion = await client.chat.completions.create(
                messages=[{"role": "user", "content": input_prompt}],
                model="openai/gpt-oss-120b",# <<<<---------------------------
                temperature=0.5
            )
            full_code = chat_completion.choices[0].message.content
            return save_code(scene_num, full_code)
        except Exception as groq_error:
            print(f"[Generator] ❌ Groq Fallback also failed: {groq_error}")
            raise api_error


def save_code(scene_number: int, full_code: str) -> str:
    cleaned_code = full_code
    code_block_match = re.search(r'```python\s*([\s\S]*?)\s*```', full_code, re.IGNORECASE)
    if code_block_match:
        cleaned_code = code_block_match.group(1).strip()
    else:
        cleaned_code = re.sub(r'```python|```', '', full_code).strip()
            
    cleaned_code = re.sub(r'<think>[\s\S]*?<\/think>', '', cleaned_code, flags=re.IGNORECASE).strip()
    
    # Inject additional imports for common hallucinations
    shim = """
from manim import *
import manim.utils.rate_functions as _rf
for _name in dir(_rf):
    if _name.startswith('ease_'):
        globals()[_name] = getattr(_rf, _name)
"""
    if "from manim import *" in cleaned_code:
        cleaned_code = cleaned_code.replace("from manim import *", shim)
    else:
        cleaned_code = shim + "\n" + cleaned_code



    # Store scenes in backend/tmp/scenes
    scenes_dir = os.path.join(BACKEND_ROOT, 'tmp', 'scenes')
    if not os.path.exists(scenes_dir):
        os.makedirs(scenes_dir)
        
    file_path = os.path.join(scenes_dir, f'scene_{scene_number}.py')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_code)

        
    print(f"[Generator] ✅ Saved Scene {scene_number} to {file_path}")
    return file_path
