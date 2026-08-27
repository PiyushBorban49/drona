"""
Dronacharya v3 — Authentication via InsForge Auth
FastAPI dependency that validates Bearer access tokens issued by the
InsForge backend and exposes the authenticated user to route handlers.

Verification strategy: token introspection against /api/auth/sessions/current,
backed by an in-memory cache keyed by token with a TTL derived from the JWT
`exp` claim (decoded unverified, used only as a cache hint).
"""
from __future__ import annotations

import base64
import json
import time
import threading

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import insforge_client

_bearer_scheme = HTTPBearer(auto_error=False)

_CACHE: dict[str, tuple[dict, float]] = {}   # token -> (user, cache_until)
_CACHE_TTL = 300.0                            # seconds
_LOCK = threading.Lock()
_CACHE_MAX = 2048


@dataclass(frozen=True)
class AuthUser:
    """Minimal identity of a verified InsForge user."""
    id: str
    email: str
    name: str = ""

    @classmethod
    def from_insforge(cls, u: dict) -> "AuthUser":
        profile = u.get("profile") or {}
        return cls(
            id=str(u.get("id") or profile.get("id") or ""),
            email=u.get("email") or profile.get("email") or "",
            name=profile.get("name") or u.get("name") or "",
        )


def _jwt_exp_hint(token: str) -> Optional[float]:
    """Best-effort `exp` extraction without signature verification."""
    try:
        payload_b64 = token.split(".")[1]
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        exp = payload.get("exp")
        return float(exp) if exp is not None else None
    except Exception:
        return None


def _cache_get(token: str) -> Optional[dict]:
    now = time.time()
    entry = _CACHE.get(token)
    if not entry:
        return None
    user, until = entry
    if now >= until:
        _CACHE.pop(token, None)
        return None
    return user


def verify_token(token: str) -> dict:
    """
    Validate token → raw InsForge user dict. Raises 401 on invalid/expired.
    Results are cached for up to _CACHE_TTL seconds.
    """
    cached = _cache_get(token)
    if cached is not None:
        return cached

    try:
        user = insforge_client.verify_access_token(token)
    except insforge_client.InsForgeError as e:
        # Surface the REAL reason in the server console (env missing, network,
        # InsForge 5xx...) while returning a safe message to the client.
        print(f"[auth] token verification failed → HTTP 503 | cause: {e}", flush=True)
        raise HTTPException(status_code=503 if e.status_code >= 500 else e.status_code,
                            detail="Auth service unavailable") from e

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    ttl = _CACHE_TTL
    exp = _jwt_exp_hint(token)
    if exp is not None:
        ttl = max(15.0, min(_CACHE_TTL, exp - time.time()))

    with _LOCK:
        if len(_CACHE) >= _CACHE_MAX:
            # naive eviction: drop expired + oldest entries
            for k in list(_CACHE.keys())[: _CACHE_MAX // 4]:
                _CACHE.pop(k, None)
        _CACHE[token] = (user, time.time() + ttl)

    return user


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthUser:
    """
    Require a valid InsForge access token:
      Authorization: Bearer <accessToken>
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    user = verify_token(credentials.credentials)
    auth_user = AuthUser.from_insforge(user)
    if not auth_user.id:
        raise HTTPException(status_code=401, detail="Token did not resolve to a user")

    # stash for optional logging
    request.state.user = auth_user
    return auth_user


def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> Optional[AuthUser]:
    """Authenticate if a token is present; otherwise allow anonymous access."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        return get_current_user(request, credentials)
    except HTTPException as e:
        if e.status_code == 401:
            return None
        raise
