"""
Dronacharya v3 — Media Storage Service (InsForge Storage)
Uploads generated media (final videos, keyframes) to InsForge storage
buckets and returns durable public URLs. Replaces static-file serving
from the (ephemeral) container filesystem as the primary delivery path.
"""
from __future__ import annotations

import os

from app.services import insforge_client

VIDEO_BUCKET = "videos"
KEYFRAME_BUCKET = "keyframes"


def upload_video(video_path: str, filename: str | None = None) -> dict | None:
    """Upload a generated .mp4 to the public `videos` bucket."""
    if not os.path.exists(video_path):
        return None
    name = filename or os.path.basename(video_path)
    key = f"generated/{name}"
    try:
        result = insforge_client.upload_file(VIDEO_BUCKET, key, video_path,
                                             content_type="video/mp4")
        print(f"[Storage] ✅ Uploaded video → {result['url']}")
        return result
    except Exception as e:
        print(f"[Storage] ❌ Video upload failed: {e}")
        return None


def upload_keyframe(image_path: str, filename: str | None = None) -> dict | None:
    """Upload a keyframe image to the public `keyframes` bucket."""
    if not os.path.exists(image_path):
        return None
    name = filename or os.path.basename(image_path)
    key = f"keyframes/{name}"
    try:
        return insforge_client.upload_file(KEYFRAME_BUCKET, key, image_path)
    except Exception as e:
        print(f"[Storage] ❌ Keyframe upload failed: {e}")
        return None


def delete_media(bucket: str, key: str) -> bool:
    """Best-effort delete; returns True when the API accepted it."""
    try:
        insforge_client.db_delete  # noqa: B018 — placeholder to keep imports honest
        from urllib.parse import quote
        import httpx
        resp = httpx.delete(
            f"{insforge_client.get_settings().INSFORGE_URL.rstrip('/')}/api/storage/buckets/{bucket}/objects/{quote(key)}",
            headers={"Authorization": f"Bearer {insforge_client.get_settings().INSFORGE_API_KEY}"},
            timeout=30.0,
        )
        return resp.status_code < 400
    except Exception as e:
        print(f"[Storage] Delete failed ({bucket}/{key}): {e}")
        return False
