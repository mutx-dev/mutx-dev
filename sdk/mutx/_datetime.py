from __future__ import annotations

from datetime import datetime


def parse_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    if value.endswith('Z'):
        value = f"{value[:-1]}+00:00"
    return datetime.fromisoformat(value)
