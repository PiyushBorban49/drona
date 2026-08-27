"""
Dronacharya v3 — Vector Store Service (InsForge pgvector)
Replaces MongoDB Atlas Vector Search. Embeddings are generated through the
InsForge AI gateway (openai/text-embedding-3-small, 1536-dim) and stored in
the public.workspace_embeddings table (pgvector). Similarity search runs via
the match_workspace_chunks RPC (cosine distance, HNSW index).
"""
from __future__ import annotations

from app.config import get_settings
from app.services import insforge_client

VECTOR_TABLE = "workspace_embeddings"


def ingest_documents(texts: list[str], metadatas: list[dict], ids: list[str]):
    """Embed + insert documents into the workspace_embeddings table."""
    if not texts:
        return

    embeddings = insforge_client.embed_texts(texts)

    rows = []
    for i in range(len(texts)):
        rows.append({
            "workspace_id": metadatas[i].get("workspace_id"),
            "text": texts[i],
            "embedding": embeddings[i],          # JSON array → vector column
            "metadata": metadatas[i] or {},
            "id_ref": ids[i],
        })

    insforge_client.db_insert(VECTOR_TABLE, rows)
    print(f"--- Ingested {len(texts)} documents into InsForge pgvector ---")


def search_documents(
    workspace_id: str | None,
    query: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Semantic similarity search scoped to a workspace.
    Falls back to an unfiltered search when the filtered one is empty
    (same behaviour as the previous Atlas implementation).
    """
    query_vector = insforge_client.embed_query(query)

    results = insforge_client.rpc("match_workspace_chunks", {
        "query_embedding": query_vector,
        "match_count": top_k,
        "filter_workspace_id": workspace_id,
    }) or []

    if not results and workspace_id is not None:
        results = insforge_client.rpc("match_workspace_chunks", {
            "query_embedding": query_vector,
            "match_count": top_k,
            "filter_workspace_id": None,
        }) or []

    return results


def get_workspace_context(workspace_id: str, query: str, top_k: int = 5) -> str:
    """Retrieve relevant workspace text for RAG prompts."""
    try:
        results = search_documents(workspace_id, query, top_k=top_k)
        docs = [r.get("text", "") for r in results if r.get("text")]
        return "\n\n".join(docs)
    except Exception as e:
        print(f"pgvector search error: {e}")
        return ""
