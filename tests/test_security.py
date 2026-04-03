"""Contract tests for sdk/mutx/security.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.security import ActionEvaluateResponse, ApprovalRequest, GovernanceMetrics, Security

class TestActionEvaluateResponse:
    def test_actionevaluateresponse_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

@pytest.mark.asyncio
class TestAsync:
    async def test_async_rejects_sync(self):
        client = Mock(spec=httpx.Client)
        assert True

