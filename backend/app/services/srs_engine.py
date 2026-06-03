"""
Dronacharya v3 — Spaced Repetition System (SM-2 Algorithm)
Tracks user memory decay and schedules optimal review times.
"""
from datetime import datetime, timedelta
from typing import Optional
from app.services.mongo_client import get_srs_collection


def get_due_items(user_id: str, limit: int = 20) -> list[dict]:
    """Get items due for review for a user."""
    collection = get_srs_collection()
    now = datetime.utcnow()
    items = list(
        collection.find(
            {"user_id": user_id, "next_review": {"$lte": now}}
        )
        .sort("next_review", 1)
        .limit(limit)
    )
    # Convert ObjectId to string for JSON serialization
    for item in items:
        item["_id"] = str(item["_id"])
    return items


def get_user_stats(user_id: str) -> dict:
    """Get SRS statistics for a user."""
    collection = get_srs_collection()
    now = datetime.utcnow()

    total = collection.count_documents({"user_id": user_id})
    due = collection.count_documents({"user_id": user_id, "next_review": {"$lte": now}})
    mastered = collection.count_documents({"user_id": user_id, "interval_days": {"$gte": 21}})

    return {
        "total_cards": total,
        "due_now": due,
        "mastered": mastered,
        "learning": total - mastered,
    }


def add_item(user_id: str, concept_id: str, front: str, back: str, topic: str = ""):
    """Add a new item to the SRS system."""
    collection = get_srs_collection()

    # Check if already exists
    existing = collection.find_one({"user_id": user_id, "concept_id": concept_id})
    if existing:
        return {"status": "exists", "id": str(existing["_id"])}

    doc = {
        "user_id": user_id,
        "concept_id": concept_id,
        "front": front,
        "back": back,
        "topic": topic,
        "easiness_factor": 2.5,
        "interval_days": 0,
        "repetitions": 0,
        "next_review": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "last_reviewed": None,
    }
    result = collection.insert_one(doc)
    return {"status": "created", "id": str(result.inserted_id)}


def record_review(user_id: str, concept_id: str, quality: int) -> dict:
    """
    Record a review response using SM-2 algorithm.

    quality: 0-5 scale
        0 = complete blackout
        1 = incorrect, remembered after seeing answer
        2 = incorrect, but seemed easy to recall
        3 = correct, with serious difficulty
        4 = correct, after hesitation
        5 = perfect response
    """
    collection = get_srs_collection()
    item = collection.find_one({"user_id": user_id, "concept_id": concept_id})

    if not item:
        return {"error": "Item not found"}

    ef = item.get("easiness_factor", 2.5)
    interval = item.get("interval_days", 0)
    reps = item.get("repetitions", 0)

    # SM-2 Algorithm
    if quality < 3:
        # Failed — reset
        reps = 0
        interval = 0
    else:
        # Success — increase interval
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = round(interval * ef)
        reps += 1

    # Update easiness factor
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, ef)  # Minimum EF

    next_review = datetime.utcnow() + timedelta(days=max(interval, 1))

    collection.update_one(
        {"user_id": user_id, "concept_id": concept_id},
        {
            "$set": {
                "easiness_factor": round(ef, 2),
                "interval_days": interval,
                "repetitions": reps,
                "next_review": next_review,
                "last_reviewed": datetime.utcnow(),
            }
        },
    )

    return {
        "concept_id": concept_id,
        "new_interval_days": interval,
        "next_review": next_review.isoformat(),
        "easiness_factor": round(ef, 2),
        "repetitions": reps,
    }
