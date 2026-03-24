import time
from typing import Any, Dict, Optional, Tuple

_cache: Dict[str, Tuple[float, Any]] = {}


def get(key: str, ttl_seconds: int = 300) -> Optional[Any]:
    if key in _cache:
        timestamp, value = _cache[key]
        if time.time() - timestamp < ttl_seconds:
            return value
        del _cache[key]
    return None


def set(key: str, value: Any):
    _cache[key] = (time.time(), value)


def clear():
    _cache.clear()
