from __future__ import annotations


def classify_failure(text: str) -> str | None:
    hay = (text or "").lower()
    if not hay.strip():
        return None
    if "quota exceeded" in hay or "billing details" in hay or "insufficient_quota" in hay:
        return "quota_exceeded"
    if "http error 404" in hay or "not found" in hay and "api" in hay:
        return "provider_failure"
    if "auth" in hay and ("failed" in hay or "missing" in hay or "invalid" in hay):
        return "auth_failure"
    if "api key" in hay and ("missing" in hay or "invalid" in hay):
        return "auth_failure"
    if "no module named 'openclaw'" in hay:
        return "runtime_bootstrap_failure"
    if "unknown option '--task'" in hay:
        return "stale_cli_contract"
    if "must be run in a work tree" in hay or "not a git repository" in hay:
        return "invalid_worktree"
    return None
