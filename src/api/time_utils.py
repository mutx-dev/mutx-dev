from datetime import datetime, timezone


def as_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def utc_now_naive() -> datetime:
    return as_utc_naive(datetime.now(timezone.utc))
