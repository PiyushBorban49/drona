"""
Dronacharya v3 — User Service
Handles updating user stats (XP, streaks, completion) in MongoDB.
"""
from datetime import datetime, timedelta
from app.services.mongo_client import get_database

def award_xp(user_id: str, xp_amount: int):
    """Awards XP to a user and handles leveling up."""
    db = get_database()
    users = db["users"]
    
    # Update XP and calculate level
    user = users.find_one({"clerkId": user_id})
    if not user:
        return {"success": False, "error": "User not found"}
        
    current_xp = user.get("xp", 0) + xp_amount
    # Simple level formula: Level = floor(xp / 500) + 1
    new_level = (current_xp // 500) + 1
    
    users.update_one(
        {"clerkId": user_id},
        {
            "$set": {
                "xp": current_xp,
                "level": new_level,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    return {"success": True, "new_xp": current_xp, "new_level": new_level}

def update_streak(user_id: str):
    """Updates the user's daily streak."""
    db = get_database()
    users = db["users"]
    
    user = users.find_one({"clerkId": user_id})
    if not user:
        return {"success": False, "error": "User not found"}
        
    last_updated = user.get("updatedAt")
    current_streak = user.get("streak", 0)
    
    now = datetime.utcnow()
    
    if last_updated:
        delta = now.date() - last_updated.date()
        if delta.days == 1:
            current_streak += 1
        elif delta.days > 1:
            current_streak = 1
    else:
        current_streak = 1
        
    users.update_one(
        {"clerkId": user_id},
        {
            "$set": {
                "streak": current_streak,
                "updatedAt": now
            }
        }
    )
    return {"success": True, "streak": current_streak}

def track_study_time(user_id: str, minutes: int):
    """Tracks hours learned."""
    db = get_database()
    users = db["users"]
    
    # We store hoursLearned as a number (float or int)
    hours_to_add = minutes / 60.0
    
    users.update_one(
        {"clerkId": user_id},
        {
            "$inc": {"hoursLearned": round(hours_to_add, 2)},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    return {"success": True}

def track_item_for_later(user_id: str, item: dict):
    """Adds an item (course, video, topic) to the user's continueLearning list."""
    db = get_database()
    users = db["users"]
    
    # Check if item with same ID already exists to avoid duplicates
    item_id = item.get("id")
    users.update_one(
        {"clerkId": user_id},
        {
            "$pull": {"continueLearning": {"id": item_id}}
        }
    )
    
    # Push the new item to the front of the list
    users.update_one(
        {"clerkId": user_id},
        {
            "$push": {
                "continueLearning": {
                    "$each": [item],
                    "$position": 0,
                    "$slice": 10 # Keep last 10 items
                }
            },
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    return {"success": True}
