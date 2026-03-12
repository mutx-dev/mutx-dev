from __future__ import annotations

import sys
import warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx import MutxAsyncClient


def test_mutx_async_client_emits_deprecation_warning() -> None:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        client = MutxAsyncClient(api_key="test-key", base_url="https://api.test")
        try:
            assert any("MutxAsyncClient is deprecated" in str(item.message) for item in caught)
        finally:
            import asyncio

            asyncio.run(client.aclose())
