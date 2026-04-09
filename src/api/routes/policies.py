"""
Policy management routes — CRUD + SSE hot-reload endpoint.
"""

import asyncio
import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.policy_store import Policy, PolicyStore, get_policy_store

router = APIRouter(prefix="/policies", tags=["policies"])
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


async def _require_store() -> PolicyStore:
    return await get_policy_store()


# ------------------------------------------------------------------
# CRUD
# ------------------------------------------------------------------


@router.get("", response_model=list[Policy])
async def list_policies(
    store: Annotated[PolicyStore, Depends(_require_store)],
    _user: Annotated[User, Depends(get_current_user)],
):
    """List all stored policies."""
    return await store.list_policies()


@router.post("", response_model=Policy, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy: Policy,
    store: Annotated[PolicyStore, Depends(_require_store)],
    _user: Annotated[User, Depends(get_current_user)],
):
    """Create a new policy."""
    existing = await store.get_policy(policy.name)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Policy '{policy.name}' already exists",
        )
    return await store.upsert_policy(policy)


@router.get("/{name}", response_model=Policy)
async def get_policy(
    name: str,
    store: Annotated[PolicyStore, Depends(_require_store)],
    _user: Annotated[User, Depends(get_current_user)],
):
    """Fetch a single policy by name."""
    policy = await store.get_policy(name)
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")
    return policy


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    name: str,
    store: Annotated[PolicyStore, Depends(_require_store)],
    _user: Annotated[User, Depends(get_current_user)],
):
    """Delete a policy by name."""
    deleted = await store.delete_policy(name)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")


# ------------------------------------------------------------------
# SSE hot-reload
# ------------------------------------------------------------------


class _SSEClient:
    """Async send-capable stand-in for EventSourceResponse (used for tracking)."""

    async def send(self, payload: str) -> None:
        pass


async def _sse_reload_generator(
    store: PolicyStore,
    policy_name: str,
    initial_version: int,
    sse_client: _SSEClient,
):
    """
    Yield SSE events as long as the policy version has not changed.
    Exits when the policy is updated or deleted.
    """
    try:
        # Send initial connected comment
        yield 'data: {"event":"connected","policy":"' + policy_name + '"}\n\n'
        while True:
            await asyncio.sleep(5)
            current = await store.get_policy(policy_name)
            if current is None:
                # Policy was deleted — send end signal and exit
                yield 'data: {"event":"deleted","policy":"' + policy_name + '"}\n\n'
                break
            if current.version != initial_version:
                # Version changed — send reload event and exit
                yield f"data: {json.dumps({'event': 'reload', 'policy': policy_name, 'version': current.version})}\n\n"
                break
    except asyncio.CancelledError:
        # Client disconnected gracefully
        pass
    finally:
        store.unregister_reload_client(sse_client)


@router.post("/{name}/reload")
async def reload_policy(
    name: str,
    store: Annotated[PolicyStore, Depends(_require_store)],
    _user: Annotated[User, Depends(get_current_user)],
):
    """
    SSE endpoint that pushes a 'reload' event when the named policy is
    updated (version increments) or deleted.

    The stream stays open and monitors the policy version, exiting when
    a change is detected so clients can re-fetch the policy.
    """
    policy = await store.get_policy(name)
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    initial_version = policy.version

    async def event_generator():
        client = _SSEClient()
        store.register_reload_client(client)
        try:
            async for chunk in _sse_reload_generator(store, name, initial_version, client):
                yield chunk
        finally:
            store.unregister_reload_client(client)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
