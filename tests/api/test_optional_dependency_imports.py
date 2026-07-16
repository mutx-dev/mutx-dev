from __future__ import annotations

import pytest

from src.api.services import pico_coach, stripe_service


def test_missing_stripe_dependency_fails_at_call_time() -> None:
    missing_stripe = stripe_service._MissingStripe()

    with pytest.raises(AttributeError, match="stripe package is not installed"):
        missing_stripe.Customer.create(email="test@example.com")


def test_missing_openai_client_fails_at_call_time() -> None:
    with pytest.raises(RuntimeError, match="openai package is not installed"):
        pico_coach._MissingAsyncOpenAI(api_key="sk-test-key")
