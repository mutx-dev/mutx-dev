import json

import pytest
from starlette.requests import Request

from src.api.exception_handlers import generic_exception_handler


@pytest.mark.asyncio
async def test_generic_exception_handler_returns_json_safe_payload():
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/boom",
            "headers": [],
            "query_string": b"",
        }
    )

    response = await generic_exception_handler(request, RuntimeError("boom"))

    assert response.status_code == 500
    payload = json.loads(response.body)
    assert payload["error_code"] == "INTERNAL_ERROR"
    assert isinstance(payload["timestamp"], str)
