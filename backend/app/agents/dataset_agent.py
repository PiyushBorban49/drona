"""
Dronacharya v3 — Dataset Ingestion Agent
Analyzes CSV, JSON, and raw datasets using Pandas and LLM synthesis.
"""
import pandas as pd
import os
from typing import List, Dict, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

async def analyze_dataset_stats(file_path: str) -> str:
    """Extract statistical summary and structural info from a dataset."""
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith('.json'):
            df = pd.read_json(file_path)
        else:
            return "Unsupported format."
            
        summary = f"Columns: {', '.join(df.columns)}\n"
        summary += f"Shape: {df.shape}\n"
        summary += f"Summary Stats:\n{df.describe().to_string()}\n"
        summary += f"First 3 rows:\n{df.head(3).to_string()}\n"
        
        return summary
    except Exception as e:
        print(f"Dataset analysis error: {e}")
        return ""

async def synthesize_dataset_knowledge(filename: str, stats: str) -> Dict:
    """Use AI to synthesize dataset statistics into high-level insights."""
    if not stats:
        return {"summary": "Analysis failed.", "concepts": [], "key_points": []}

    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert data scientist. Analyze the following statistical summary of a dataset and provide a high-level overview, key trends/concepts, and potential research questions. Return valid JSON."),
        ("user", "Dataset: {filename}\n\nStats:\n{stats}\n\nReturn JSON: {{ 'summary': '...', 'concepts': [{{ 'title': '...', 'description': '...' }}], 'key_points': ['...', '...'] }}")
    ])

    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke({"filename": filename, "stats": stats[:12000]})
    except Exception as e:
        print(f"Dataset synthesis error: {e}")
        return {"summary": "Data analysis failed.", "concepts": []}

async def process_dataset(file_path: str) -> Dict:
    """Main orchestration for Dataset ingestion."""
    stats = await analyze_dataset_stats(file_path)
    if not stats:
        return {"success": False, "error": "Could not parse dataset structure."}

    analysis = await synthesize_dataset_knowledge(os.path.basename(file_path), stats)
    
    return {
        "success": True,
        "filename": os.path.basename(file_path),
        "analysis": analysis,
        "stats_preview": stats[:500]
    }
