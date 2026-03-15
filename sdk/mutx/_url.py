from __future__ import annotations

from urllib.parse import urlsplit, urlunsplit

_LEGACY_API_SUFFIXES = ("/api/v1", "/v1", "/api")


def _strip_legacy_suffix(path: str) -> str:
    normalized_path = path.rstrip("/")

    for suffix in _LEGACY_API_SUFFIXES:
        if normalized_path == suffix:
            return ""
        if normalized_path.endswith(suffix):
            return normalized_path[: -len(suffix)] or ""

    return normalized_path


def normalize_api_base_url(value: str) -> str:
    normalized_value = value.strip().rstrip("/")
    if not normalized_value:
        return normalized_value

    # urlsplit mis-parses values like localhost:8000 without a scheme.
    if "://" not in normalized_value:
        return _strip_legacy_suffix(normalized_value)

    parsed = urlsplit(normalized_value)
    normalized_path = _strip_legacy_suffix(parsed.path)
    return urlunsplit(parsed._replace(path=normalized_path))
