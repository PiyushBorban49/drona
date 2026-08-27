"""
Dronacharya v3 — InsForge Backend Client
Single gateway for all InsForge platform calls from the FastAPI backend:
  - Auth token verification (introspection via /api/auth/sessions/current)
  - Database records CRUD + RPC (PostgREST-style REST API)
  - AI gateway embeddings (/api/ai/embeddings)
  - Storage uploads (upload-strategy: direct multipart or presigned)

Credentials come from app.config Settings:
  INSFORGE_URL      e.g. https://<appkey>.us-east.insforge.app
  INSFORGE_API_KEY  admin key (ik_...) — full-access, server-side only
"""
from __future__ import annotations

import os
import uuid
import mimetypes
from typing import Any

import httpx

from app.config import get_settings


class InsForgeError(Exception):
    """Raised when an InsForge API call fails."""

    def __init__(self, message: str, status_code: int = 500, payload: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


_client: httpx.Client | None = None


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        s = get_settings()
        _client = httpx.Client(
            base_url=s.INSFORGE_URL.rstrip("/"),
            timeout=httpx.Timeout(60.0),
        )
    return _client


def _admin_headers() -> dict[str, str]:
    s = get_settings()
    return {
        "Authorization": f"Bearer {s.INSFORGE_API_KEY}",
        "Content-Type": "application/json",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────────────────────────────────────

def verify_access_token(token: str) -> dict | None:
    """
    Validate a user access token issued by InsForge.
    Returns the user dict on success, or None when the token is invalid/expired.
    """
    try:
        resp = _get_client().get(
            "/api/auth/sessions/current",
            headers={"Authorization": f"Bearer {token}"},
        )
    except httpx.HTTPError as e:
        raise InsForgeError(f"Auth verification unreachable: {e}", status_code=503) from e

    if resp.status_code == 401 or resp.status_code == 403:
        return None
    if resp.status_code != 200:
        raise InsForgeError(
            f"Unexpected auth response ({resp.status_code}): {resp.text[:200]}",
            status_code=502,
        )

    body = resp.json()
    user = body.get("user") if isinstance(body, dict) else None
    return user or None


def sign_up(email: str, password: str, name: str | None = None) -> dict:
    """Create an InsForge auth user (proxied for convenience / admin flows)."""
    payload: dict[str, Any] = {"email": email, "password": password}
    if name:
        payload["name"] = name
    return _request("POST", "/api/auth/users", json=payload)


def sign_in(email: str, password: str) -> dict:
    """Password sign-in against InsForge Auth."""
    return _request("POST", "/api/auth/sessions", json={"email": email, "password": password})


# ──────────────────────────────────────────────────────────────────────────────
# Database records (PostgREST-style)
# ──────────────────────────────────────────────────────────────────────────────

def _request(method: str, path: str, *, json: Any = None) -> Any:
    try:
        resp = _get_client().request(method, path, json=json, headers=_admin_headers())
    except httpx.HTTPError as e:
        raise InsForgeError(f"InsForge {method} {path} failed: {e}", status_code=503) from e
    if resp.status_code >= 400:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text[:300]
        raise InsForgeError(f"{method} {path} → {resp.status_code}: {detail}", status_code=resp.status_code)
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


def db_insert(table: str, rows: list[dict]) -> Any:
    """Insert one-or-many rows. Rows must be passed as a list."""
    return _request("POST", f"/api/database/records/{table}", json=rows)


def db_select(table: str, *, select: str = "*", filters: dict[str, str] | None = None,
              order: str | None = None, limit: int | None = None) -> list[dict]:
    params: dict[str, Any] = {"select": select}
    if filters:
        # PostgREST operator syntax, e.g. {"user_id": "eq.<uuid>"}
        params.update(filters)
    if order:
        params["order"] = order
    if limit is not None:
        params["limit"] = limit
    import urllib.parse
    qs = urllib.parse.urlencode(params)
    result = _request("GET", f"/api/database/records/{table}?{qs}")
    return result if isinstance(result, list) else [result]


def db_update(table: str, filters: dict[str, str], patch: dict) -> Any:
    import urllib.parse
    params = "&".join(f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}" for k, v in filters.items())
    return _request("PATCH", f"/api/database/records/{table}?{params}", json=patch)


def db_delete(table: str, filters: dict[str, str]) -> Any:
    import urllib.parse
    params = "&".join(f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}" for k, v in filters.items())
    return _request("DELETE", f"/api/database/records/{table}?{params}")


def rpc(fn_name: str, args: dict) -> Any:
    """Call a Postgres function via the backend's RPC endpoint."""
    return _request("POST", f"/api/database/rpc/{fn_name}", json=args)


# ──────────────────────────────────────────────────────────────────────────────
# AI gateway — embeddings
# ──────────────────────────────────────────────────────────────────────────────

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings through the InsForge AI gateway (OpenRouter)."""
    s = get_settings()
    data = _request("POST", "/api/ai/embeddings",
                    json={"model": s.EMBEDDING_MODEL, "input": texts})
    items = data.get("data") if isinstance(data, dict) else data
    if not items or len(items) != len(texts):
        raise InsForgeError(f"Embedding count mismatch: got {len(items or [])}, want {len(texts)}")
    return [item["embedding"] for item in items]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]


# ──────────────────────────────────────────────────────────────────────────────
# Storage
# ──────────────────────────────────────────────────────────────────────────────

def upload_file(bucket: str, key: str, file_path: str,
                content_type: str | None = None) -> dict:
    """
    Upload a local file to an InsForge storage bucket.

    Returns {"url": <public/display url>, "key": <object key>, "bucket": bucket}.
    Both url AND key should be persisted (url for display, key for download/delete).
    """
    size = os.path.getsize(file_path)
    ctype = content_type or mimetypes.guess_type(file_path)[0] or "application/octet-stream"

    strategy = _request(
        "POST",
        f"/api/storage/buckets/{bucket}/upload-strategy",
        json={"filename": key, "contentType": ctype, "size": size},
    )

    method = strategy.get("method")
    with open(file_path, "rb") as fh:
        file_bytes = fh.read()

    if method == "direct":
        from urllib.parse import quote
        url_path = f"/api/storage/buckets/{bucket}/objects/{quote(key)}"
        resp = _get_client().put(
            url_path,
            files={"file": (os.path.basename(key), file_bytes, ctype)},
            headers={"Authorization": f"Bearer {get_settings().INSFORGE_API_KEY}"},
        )
        if resp.status_code >= 400:
            raise InsForgeError(f"Direct upload failed ({resp.status_code}): {resp.text[:300]}",
                                status_code=resp.status_code)
        data = resp.json() if resp.content else {}

    elif method == "presigned":
        form: dict[str, Any] = dict(strategy.get("fields") or {})
        form["file"] = (os.path.basename(key), file_bytes, ctype)
        presigned_resp = httpx.post(strategy["uploadUrl"], data=None, files=form, timeout=120.0)
        if presigned_resp.status_code >= 400:
            raise InsForgeError(
                f"Presigned upload failed ({presigned_resp.status_code}): {presigned_resp.text[:300]}")
        if strategy.get("confirmRequired") and strategy.get("confirmUrl"):
            # Confirm registers the object; its response carries the canonical
            # fields incl. the display `url`.
            data = _request("POST", strategy["confirmUrl"],
                            json={"size": size, "contentType": ctype})
        else:
            data = {"key": key}

    else:
        raise InsForgeError(f"Unsupported upload strategy: {method}")

    object_key = data.get("key") or key
    public_url = data.get("url") or get_public_url(bucket, object_key)
    return {"url": public_url, "key": object_key, "bucket": bucket}


def get_public_url(bucket: str, key: str) -> str:
    """Fallback display URL for a stored object (works for public buckets)."""
    from urllib.parse import quote
    base = get_settings().INSFORGE_URL.rstrip("/")
    return f"{base}/api/storage/buckets/{bucket}/objects/{quote(key, safe='')}"


def upload_bytes(bucket: str, key: str, data: bytes,
                 content_type: str = "application/octet-stream") -> dict:
    """Upload raw bytes by writing them to a temp file first (reuses upload_file)."""
    tmp_dir = os.path.join(os.getcwd(), "tmp", "uploads")
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4().hex}_{os.path.basename(key)}")
    with open(tmp_path, "wb") as f:
        f.write(data)
    try:
        return upload_file(bucket, key, tmp_path, content_type=content_type)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
