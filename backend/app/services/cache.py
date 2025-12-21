# Simple in-memory cache for analysis results.

from typing import Any

_CACHE: dict[str, Any] = {}


def get_cached(key: str) -> Any | None:
    return _CACHE.get(key)


def set_cached(key: str, value: Any) -> None:
    _CACHE[key] = value
