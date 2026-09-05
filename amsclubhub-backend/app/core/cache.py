"""
Cache layer cho các GET endpoint để giảm round-trip tới DB remote (Supabase).

Dùng Redis client SYNC riêng (không phải client async trong app.core.redis) vì các
endpoint này là sync (def). Mọi thao tác bọc try/except → fail-open: nếu Redis lỗi,
hệ thống vẫn query DB bình thường.
"""
import hashlib
import json
from typing import Any, Optional

import redis as redis_sync

from app.core.config import settings

_cache: Optional[redis_sync.Redis] = None


def _get_client() -> redis_sync.Redis:
    global _cache
    if _cache is None:
        _cache = redis_sync.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_timeout=1,
            socket_connect_timeout=1,
        )
    return _cache


def cache_key(*parts: Any) -> str:
    """Băm các thành phần khóa (params request) thành chuỗi an toàn."""
    raw = "|".join("" if p is None else str(p) for p in parts)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def get_cached(key: str) -> Optional[str]:
    try:
        return _get_client().get(key)
    except Exception:
        return None


def set_cached(key: str, value: Any, ttl: int = 20) -> None:
    try:
        _get_client().set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass


def invalidate(namespace: str) -> None:
    """Tăng version counter → các cache key chứa version cũ tự hết hạn logic."""
    try:
        _get_client().incr(f"v:{namespace}")
    except Exception:
        pass


def get_version(namespace: str) -> int:
    try:
        val = _get_client().get(f"v:{namespace}")
        return int(val) if val else 0
    except Exception:
        return 0