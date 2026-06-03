"""
Dronacharya v3 — Knowledge Graph Router
Handles the Knowledge Galaxy feature.
"""
from fastapi import APIRouter
from app.schemas.models import KnowledgeGraphRequest
from app.agents.knowledge_graph_agent import generate_knowledge_graph
from app.services.vector_store import get_workspace_context
from app.services.srs_engine import get_user_stats

router = APIRouter(prefix="/knowledge", tags=["Knowledge Galaxy"])


@router.post("/graph")
async def get_knowledge_graph(request: KnowledgeGraphRequest):
    context = get_workspace_context(request.workspace_id, "knowledge graph concepts entities")

    # Get mastery data from SRS if available
    mastery_data = {}
    try:
        from app.services.mongo_client import get_srs_collection
        collection = get_srs_collection()
        items = list(collection.find(
            {"user_id": request.user_id},
            {"concept_id": 1, "interval_days": 1}
        ))
        for item in items:
            # Convert interval to mastery percentage (21+ days = 100%)
            days = item.get("interval_days", 0)
            mastery_data[item["concept_id"]] = min(100, int((days / 21) * 100))
    except:
        pass

    return generate_knowledge_graph(
        "Workspace", "Topic", context, mastery_data
    )
