"""
Dronacharya v3 — User Service (InsForge Postgres)
Handles updating user stats (XP, streaks, completion) in the
public.user_stats table, keyed by InsForge Auth user ids.
"""
from datetime import datetime, timezone
from typing import Optional

from app.services import insforge_client

USER_STATS_TABLE = "user_stats"

DEFAULT_LEVEL_STEP = 500  # Level = floor(xp / 500) + 1


class UserNotFound(Exception):
    pass


def ensure_user_stats(user_id: str) -> dict:
    """Make sure a stats row exists for the user; create the default one if not."""
    rows = insforge_client.db_select(
        USER_STATS_TABLE,
        select="*",
        filters={"user_id": f"eq.{user_id}"},
        limit=1,
    )
    if rows:
        return rows[0]

    try:
        created = insforge_client.db_insert(USER_STATS_TABLE, [{"user_id": user_id}])
        if isinstance(created, list) and created:
            return created[0]
    except insforge_client.InsForgeError as e:
        # Race with another writer that already inserted → re-read.
        rows = insforge_client.db_select(
            USER_STATS_TABLE, select="*", filters={"user_id": f"eq.{user_id}"}, limit=1)
        if rows:
            return rows[0]
        raise e from None

    rows = insforge_client.db_select(
        USER_STATS_TABLE, select="*", filters={"user_id": f"eq.{user_id}"}, limit=1)
    return rows[0] if rows else {}


def get_user_stats(user_id: str) -> dict:
    """Read full stats for a user (creates defaults on first read)."""
    row = ensure_user_stats(user_id)
    continue_learning = row.get("continue_learning") or []
    if isinstance(continue_learning, str):
        try:
            import json as _json
            continue_learning = _json.loads(continue_learning)
        except Exception:
            continue_learning = []
    return {
        "user_id": row.get("user_id"),
        "xp": int(row.get("xp") or 0),
        "level": int(row.get("level") or 1),
        "streak": int(row.get("streak") or 0),
        "hours_learned": float(row.get("hours_learned") or 0.0),
        "continue_learning": continue_learning,
        "updated_at": row.get("updated_at"),
    }


def award_xp(user_id: str, xp_amount: int) -> dict:
    """Awards XP to a user and handles leveling up."""
    row = ensure_user_stats(user_id)

    current_xp = int(row.get("xp") or 0) + int(xp_amount)
    new_level = (current_xp // DEFAULT_LEVEL_STEP) + 1

    insforge_client.db_update(
        USER_STATS_TABLE,
        {"user_id": f"eq.{user_id}"},
        {"xp": current_xp, "level": new_level},
    )
    return {"success": True, "new_xp": current_xp, "new_level": new_level}


def update_streak(user_id: str) -> dict:
    """Updates the user's daily streak based on last activity time."""
    row = ensure_user_stats(user_id)

    current_streak = int(row.get("streak") or 0)
    updated_at_raw = row.get("updated_at")

    now = datetime.now(timezone.utc)
    last_updated = None
    if updated_at_raw:
        try:
            last_updated = datetime.fromisoformat(str(updated_at_raw).replace("Z", "+00:00"))
            if last_updated.tzinfo is None:
                last_updated = last_updated.replace(tzinfo=timezone.utc)
        except Exception:
            last_updated = None

    if last_updated:
        delta_days = (now.date() - last_updated.date()).days
        if delta_days == 1:
            current_streak += 1
        elif delta_days > 1:
            current_streak = 1
        # same day → streak unchanged
    else:
        current_streak = max(current_streak, 1)

    insforge_client.db_update(
        USER_STATS_TABLE,
        {"user_id": f"eq.{user_id}"},
        {"streak": current_streak},
    )
    return {"success": True, "streak": current_streak}


def track_study_time(user_id: str, minutes: int) -> dict:
    """Tracks hours learned."""
    hours_to_add = round(minutes / 60.0, 2)
    row = ensure_user_stats(user_id)
    new_total = round(float(row.get("hours_learned") or 0.0) + hours_to_add, 2)

    insforge_client.db_update(
        USER_STATS_TABLE,
        {"user_id": f"eq.{user_id}"},
        {"hours_learned": new_total},
    )
    return {"success": True, "hours_learned": new_total}


def track_item_for_later(user_id: str, item: dict) -> dict:
    """Adds an item (course, video, topic) to the front of continueLearning (max 10)."""
    row = ensure_user_stats(user_id)

    items = row.get("continue_learning")
    if isinstance(items, str):
        try:
            import json as _json
            items = _json.loads(items)
        except Exception:
            items = []
    if not isinstance(items, list):
        items = []

    item_id = item.get("id")
    items = [existing for existing in items
             if not (item_id and isinstance(existing, dict) and existing.get("id") == item_id)]
    items.insert(0, item)
    items = items[:10]

    insforge_client.db_update(
        USER_STATS_TABLE,
        {"user_id": f"eq.{user_id}"},
        {"continue_learning": items},
    )
    return {"success": True}
