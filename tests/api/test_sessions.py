"""Tests for session routes — dedup and merge logic."""

from src.api.routes.sessions import (
    merge_and_dedupe_sessions,
)


class TestMergeAndDedupeSessions:
    """Verify that merge_and_dedupe_sessions correctly deduplicates by id."""

    def test_dedup_by_id_only(self):
        """Local sessions prefix source in their id; dedup key should use id directly."""
        gateway = [
            {"id": "gw-session-1", "source": "openclaw", "last_activity": 100},
        ]
        claude = [
            {"id": "claude:abc123", "source": "claude", "last_activity": 200},
        ]
        codex = [
            {"id": "codex:def456", "source": "codex", "last_activity": 300},
        ]
        hermes = [
            {"id": "hermes:ghi789", "source": "hermes", "last_activity": 400},
        ]

        result = merge_and_dedupe_sessions(gateway, claude, codex, hermes)
        ids = [s["id"] for s in result]

        assert "gw-session-1" in ids
        assert "claude:abc123" in ids
        assert "codex:def456" in ids
        assert "hermes:ghi789" in ids
        assert len(result) == 4

    def test_dedup_keeps_newer_duplicate(self):
        """When two sessions have the same id, keep the one with higher last_activity."""
        claude_old = [
            {"id": "claude:shared-id", "source": "claude", "last_activity": 100},
        ]
        claude_new = [
            {"id": "claude:shared-id", "source": "claude", "last_activity": 500},
        ]

        result = merge_and_dedupe_sessions(claude_old, claude_new, [], [])
        assert len(result) == 1
        assert result[0]["last_activity"] == 500

    def test_dedup_across_sources_with_same_raw_id(self):
        """If gateway and local sessions share the same raw id, they dedupe correctly."""
        gateway = [
            {"id": "session-xyz", "source": "openclaw", "last_activity": 100},
        ]
        # A local session with the *same* raw id would not typically exist,
        # but if it did, dedup should keep the newer one
        claude = [
            {"id": "session-xyz", "source": "claude", "last_activity": 200},
        ]

        result = merge_and_dedupe_sessions(gateway, claude, [], [])
        assert len(result) == 1
        assert result[0]["last_activity"] == 200

    def test_empty_inputs(self):
        """Empty inputs should return empty list."""
        result = merge_and_dedupe_sessions([], [], [], [])
        assert result == []

    def test_sessions_without_id_are_skipped(self):
        """Sessions missing an id field should be skipped."""
        sessions_with_empty_id = [
            {"source": "claude", "last_activity": 100},  # no id
            {"id": "", "source": "claude", "last_activity": 200},  # empty id
            {"id": "valid-id", "source": "openclaw", "last_activity": 300},
        ]

        result = merge_and_dedupe_sessions(sessions_with_empty_id, [], [], [])
        assert len(result) == 1
        assert result[0]["id"] == "valid-id"

    def test_results_sorted_by_last_activity_desc(self):
        """Results should be sorted by last_activity descending."""
        sessions = [
            {"id": "a", "source": "openclaw", "last_activity": 100},
            {"id": "b", "source": "openclaw", "last_activity": 300},
            {"id": "c", "source": "openclaw", "last_activity": 200},
        ]

        result = merge_and_dedupe_sessions(sessions, [], [], [])
        ids = [s["id"] for s in result]
        assert ids == ["b", "c", "a"]

    def test_results_capped_at_100(self):
        """Results should be capped at 100 sessions."""
        sessions = [
            {"id": f"session-{i}", "source": "openclaw", "last_activity": i} for i in range(150)
        ]

        result = merge_and_dedupe_sessions(sessions, [], [], [])
        assert len(result) == 100
