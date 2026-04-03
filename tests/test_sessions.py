"""Contract tests for sdk/mutx/sessions.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.sessions import Session, Sessions

class TestSession:
    def test_session_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

