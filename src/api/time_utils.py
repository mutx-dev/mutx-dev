from datetime import datetime, timezone


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def utc_now() -> datetime:
    return as_utc(datetime.now(timezone.utc))


def as_utc_naive(value: datetime) -> datetime:
    return as_utc(value).replace(tzinfo=None)


def utc_now_naive() -> datetime:
    return as_utc_naive(utc_now())
