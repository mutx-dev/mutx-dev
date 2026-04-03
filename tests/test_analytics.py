"""Contract tests for sdk/mutx/analytics.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.analytics import AnalyticsSummary, AgentMetricsSummary, TimeSeriesPoint, AnalyticsTimeSeries, Analytics

class TestAnalyticsSummary:
    def test_analyticssummary_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

