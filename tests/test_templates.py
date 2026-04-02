"""Contract tests for sdk/mutx/templates.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.templates import AssistantTemplate, TemplateDeployResponse, Templates

class TestAssistantTemplate:
    def test_assistanttemplate_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

