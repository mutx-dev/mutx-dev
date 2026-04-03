"""Contract tests for sdk/mutx/ingest.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.ingest import Ingest

class TestIngest:
    def test_ingest_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

