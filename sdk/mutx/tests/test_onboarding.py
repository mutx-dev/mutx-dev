"""Tests for onboarding module."""

from __future__ import annotations

import asyncio
from datetime import datetime
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.onboarding import Onboarding, OnboardingState, OnboardingStep


class TestOnboardingStep:
    def test_init_required_fields(self):
        data = {
            "id": "step-1",
            "name": "Connect Wallet",
            "status": "completed",
            "completed_at": "2024-01-15T10:30:00+00:00",
        }
        step = OnboardingStep(data)
        assert step.id == "step-1"
        assert step.name == "Connect Wallet"
        assert step.status == "completed"
        assert isinstance(step.completed_at, datetime)

    def test_init_defaults(self):
        data = {"id": "step-1", "name": "Step Name"}
        step = OnboardingStep(data)
        assert step.status == "pending"
        assert step.completed_at is None


class TestOnboardingState:
    def test_init_full(self):
        data = {
            "user_id": "user-123",
            "provider": "openclaw",
            "current_step": "step-2",
            "status": "active",
            "steps": [
                {
                    "id": "step-1",
                    "name": "Step 1",
                    "status": "completed",
                    "completed_at": "2024-01-15T10:30:00+00:00",
                },
                {
                    "id": "step-2",
                    "name": "Step 2",
                    "status": "pending",
                    "completed_at": None,
                },
            ],
            "created_at": "2024-01-01T00:00:00+00:00",
            "updated_at": "2024-01-15T10:30:00+00:00",
        }
        state = OnboardingState(data)
        assert state.user_id == "user-123"
        assert state.provider == "openclaw"
        assert state.current_step == "step-2"
        assert state.status == "active"
        assert len(state.steps) == 2
        assert isinstance(state.steps[0], OnboardingStep)
        assert state.steps[0].status == "completed"
        assert state.steps[1].status == "pending"

    def test_init_defaults(self):
        data = {
            "user_id": "u1",
            "provider": "openclaw",
        }
        state = OnboardingState(data)
        assert state.current_step == ""
        assert state.status == "active"
        assert state.steps == []

    def test_repr(self):
        data = {
            "user_id": "u1",
            "provider": "openclaw",
            "current_step": "final-step",
        }
        state = OnboardingState(data)
        r = repr(state)
        assert "openclaw" in r
        assert "final-step" in r


class TestOnboarding:
    def test_init_sync(self):
        client = httpx.Client()
        ob = Onboarding(client)
        assert ob._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        ob = Onboarding(client)
        assert ob._client is client

    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        ob = Onboarding(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ob.get_state()

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        ob = Onboarding(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ob.aget_state())

    def test_get_state_method_exists(self):
        client = httpx.Client()
        ob = Onboarding(client)
        assert callable(ob.get_state)

    def test_aget_state_method_exists(self):
        client = httpx.AsyncClient()
        ob = Onboarding(client)
        assert callable(ob.aget_state)

    def test_get_state_sync(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "user_id": "user-1",
            "provider": "openclaw",
            "current_step": "step-1",
            "status": "active",
            "steps": [],
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        ob = Onboarding(mock_client)
        result = ob.get_state(provider="openclaw")

        assert isinstance(result, OnboardingState)
        assert result.user_id == "user-1"
        mock_client.get.assert_called_once()
        call_args = mock_client.get.call_args
        assert call_args[0][0] == "/onboarding"
        assert call_args[1]["params"]["provider"] == "openclaw"

    def test_update_method_exists(self):
        client = httpx.Client()
        ob = Onboarding(client)
        assert callable(ob.update)

    def test_aupdate_method_exists(self):
        client = httpx.AsyncClient()
        ob = Onboarding(client)
        assert callable(ob.aupdate)

    def test_update_sync(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "user_id": "user-1",
            "provider": "openclaw",
            "current_step": "step-1",
            "status": "active",
            "steps": [],
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ob = Onboarding(mock_client)
        result = ob.update(action="complete_step", step="step-1")

        assert isinstance(result, OnboardingState)
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == "/onboarding"
        assert call_args[1]["json"]["action"] == "complete_step"
        assert call_args[1]["json"]["step"] == "step-1"

    def test_update_with_payload(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "user_id": "user-1",
            "provider": "openclaw",
            "steps": [],
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ob = Onboarding(mock_client)
        ob.update(action="complete_step", step="step-1", payload={"key": "value"})

        call_args = mock_client.post.call_args
        assert call_args[1]["json"]["payload"] == {"key": "value"}

    def test_update_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        ob = Onboarding(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ob.update("complete_step")

    def test_aupdate_requires_async_client(self):
        sync_client = httpx.Client()
        ob = Onboarding(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ob.aupdate("complete_step"))

    def test_get_state_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        ob = Onboarding(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ob.get_state()

    def test_aget_state_requires_async_client(self):
        sync_client = httpx.Client()
        ob = Onboarding(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ob.aget_state())
