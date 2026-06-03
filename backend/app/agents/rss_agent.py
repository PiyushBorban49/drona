"""
Dronacharya v3 — RSS/Substack Ingestion Agent
Extracts and synthesizes knowledge from RSS and Substack feeds.
"""
import feedparser
from typing import List, Dict, Optional
from app.utils.security import is_safe_url

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def fetch_rss_feed(url: str, limit: int = 3) -> List[Dict]:
    """Fetch and parse an RSS feed, returning the latest entries."""
    if not is_safe_url(url):
        print(f"SSRF Attempt blocked: {url}")
        return []
    try:

        feed = feedparser.parse(url)
        entries = []
        for entry in feed.entries[:limit]:
            entries.append({
                "title": entry.title,
                "link": entry.link,
                "summary": entry.summary if hasattr(entry, 'summary') else "",
                "published": entry.published if hasattr(entry, 'published') else "Unknown"
            })
        return entries
    except Exception as e:
        print(f"RSS fetch error: {e}")
        return []

async def synthesize_feed_content(feed_title: str, entries: List[Dict]) -> Dict:
    """Use AI to summarize and extract structured data from multiple feed entries."""
    if not entries:
        return {"summary": "No entries found.", "concepts": [], "key_points": []}

    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.2)
    
    # Combine entries for analysis
    content_blob = ""
    for entry in entries:
        content_blob += f"\nTitle: {entry['title']}\nSummary: {entry['summary']}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert news and research analyst. Analyze the following RSS feed entries and provide a combined overview, key concepts, and structured insights. Return valid JSON."),
        ("user", "Feed: {feed_title}\n\nContent:\n{content}\n\nReturn JSON: {{ 'summary': 'combined overview', 'concepts': [{{ 'title': '...', 'description': '...' }}], 'key_points': ['...', '...'] }}")
    ])

    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke({"feed_title": feed_title, "content": content_blob[:10000]})
    except Exception as e:
        print(f"RSS synthesis error: {e}")
        return {"summary": "Feed analysis failed.", "concepts": []}

async def process_rss_feed(url: str) -> Dict:
    """Main orchestration for RSS/Substack ingestion."""
    if not is_safe_url(url):
        return {"success": False, "error": "Invalid or unsafe URL."}
    entries = fetch_rss_feed(url)

    if not entries:
        return {"success": False, "error": "Could not fetch or parse the RSS feed."}

    feed_title = feedparser.parse(url).feed.get('title', 'RSS Feed')
    analysis = await synthesize_feed_content(feed_title, entries)
    
    return {
        "success": True,
        "feed_title": feed_title,
        "entries": entries,
        "analysis": analysis
    }
