"""
Dronacharya v3 — MongoDB Vector Store Service
Replaces ChromaDB with MongoDB Atlas Vector Search for unified data management.
"""
import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import get_settings
from app.services.mongo_client import get_database

_embeddings: HuggingFaceEmbeddings | None = None

VECTOR_COLLECTION = "workspace_embeddings"
INDEX_NAME = "vector_index"

def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        s = get_settings()
        _embeddings = HuggingFaceEmbeddings(
            model_name=s.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True, "batch_size": 16},
        )
    return _embeddings

def get_vector_collection():
    db = get_database()
    return db[VECTOR_COLLECTION]

def ingest_documents(texts: list[str], metadatas: list[dict], ids: list[str]):
    """Ingest documents into MongoDB Atlas."""
    collection = get_vector_collection()
    embeddings = get_embeddings()
    vectors = embeddings.embed_documents(texts)
    
    docs = []
    for i in range(len(texts)):
        doc = {
            "text": texts[i],
            "embedding": vectors[i],
            "metadata": metadatas[i],
            "workspace_id": metadatas[i].get("workspace_id"),
            "id_ref": ids[i]
        }
        docs.append(doc)
    
    if docs:
        collection.insert_many(docs)
    print(f"--- Ingested {len(texts)} documents into MongoDB ---")

def get_workspace_context(
    workspace_id: str, query: str, top_k: int = 5
) -> str:
    """Retrieve relevant workspace text from MongoDB Atlas Vector Search."""
    collection = get_vector_collection()
    embeddings = get_embeddings()

    query_vector = embeddings.embed_query(query)

    pipeline = [
        {
            "$vectorSearch": {
                "index": INDEX_NAME,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": top_k,
                "filter": {"workspace_id": {"$eq": workspace_id}}
            }
        },
        {
            "$project": {
                "_id": 0,
                "text": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]

    try:
        results = list(collection.aggregate(pipeline))
        
        if not results:
            # Fallback: query without filter
            pipeline[0]["$vectorSearch"].pop("filter", None)
            results = list(collection.aggregate(pipeline))

        docs = [r["text"] for r in results]
        return "\n\n".join(docs) if docs else ""

    except Exception as e:
        print(f"MongoDB Vector Search error: {e}")
        # If index doesn't exist yet, return empty
        return ""
