from datetime import datetime, timezone

from src.api.time_utils import as_utc_naive, utc_now_naive


def test_as_utc_naive_converts_aware_datetime_to_naive_utc():
    value = datetime(2026, 3, 19, 12, 0, tzinfo=timezone.utc)

    converted = as_utc_naive(value)

    assert converted == datetime(2026, 3, 19, 12, 0)
    assert converted.tzinfo is None


def test_utc_now_naive_returns_naive_datetime():
    value = utc_now_naive()

    assert value.tzinfo is None
