from typing import List, Dict, Optional
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def perform_web_search(query: str) -> str:
    try:
        search = DuckDuckGoSearchRun()
        return search.run(query)
    except Exception as e:
        print(f"Web search error: {e}")
        return ""

async def synthesize_search_results(query: str, search_context: str) -> Dict:
    if not search_context:
        return {"summary": "No live data found for this query.", "concepts": [], "key_points": []}

    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a real-time research engine. Synthesize the following search results into a concise overview with key concepts and logic points. Return valid JSON."),
        ("user", "Query: {query}\n\nSearch Findings:\n{context}\n\nReturn JSON: {{ 'summary': 'real-time overview', 'concepts': [{{ 'title': '...', 'description': '...' }}], 'key_points': ['...', '...'], 'citations': ['url1', 'url2'] }}")
    ])

    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke({"query": query, "context": search_context})
    except Exception as e:
        print(f"Web search synthesis error: {e}")
        return {"summary": "Search analysis failed.", "concepts": []}

async def process_web_search(query: str) -> Dict:
    context = perform_web_search(query)
    if not context:
        return {"success": False, "error": "Search failed or returned no results."}

    analysis = await synthesize_search_results(query, context)
    
    return {
        "success": True,
        "query": query,
        "analysis": analysis
    }
