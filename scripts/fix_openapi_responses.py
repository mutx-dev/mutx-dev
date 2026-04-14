#!/usr/bin/env python3
"""Add missing 401/403/400/404/500 error responses to authenticated routes in openapi.json."""

import json
import sys
from pathlib import Path

SPEC_PATH = Path("docs/api/openapi.json")
BACKUP_PATH = Path("docs/api/openapi.json.bak")

ErrorResponse = {
    "description": "Error",
    "content": {
        "application/json": {
            "schema": {"$ref": "#/components/schemas/ErrorResponse"}
        }
    }
}

RESPONSES = {
    "401": {"description": "Unauthorized", **ErrorResponse},
    "403": {"description": "Forbidden", **ErrorResponse},
    "400": {"description": "Bad Request", **ErrorResponse},
    "404": {"description": "Not Found", **ErrorResponse},
    "500": {"description": "Internal Server Error", **ErrorResponse},
}


def has_auth(params, security):
    """Check if route has authentication."""
    if security is not None:
        return True
    if params:
        for p in params:
            if p.get("in") == "header" and "auth" in p.get("name", "").lower():
                return True
    return False


def needs_code(code, params, security, has_body, route_path):
    """Decide if a route needs a given error code."""
    if code in ("401", "403"):
        return has_auth(params, security)
    if code == "400":
        return has_body
    if code == "404":
        return "{id}" in route_path or "{agent_id}" in route_path or "{run_id}" in route_path
    if code == "500":
        return has_auth(params, security)
    return False


def main():
    spec = json.loads(SPEC_PATH.read_text())
    paths = spec.get("paths", {})

    total_added = 0
    routes_updated = 0

    for route_path, methods in paths.items():
        for method, details in methods.items():
            if method not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue

            params = details.get("parameters", [])
            security = details.get("security")
            req_body = details.get("requestBody")
            has_body = req_body is not None
            responses = details.setdefault("responses", {})

            route_codes_added = 0
            for code, resp_def in RESPONSES.items():
                if code not in responses and needs_code(code, params, security, has_body, route_path):
                    responses[code] = resp_def
                    route_codes_added += 1

            if route_codes_added:
                routes_updated += 1
                total_added += route_codes_added
                print(f"  +{route_codes_added} {method.upper()} {route_path}")

    # Add ErrorResponse schema if missing
    if "components" not in spec:
        spec["components"] = {}
    if "schemas" not in spec["components"]:
        spec["components"]["schemas"] = {}
    if "ErrorResponse" not in spec["components"]["schemas"]:
        spec["components"]["schemas"]["ErrorResponse"] = {
            "type": "object",
            "properties": {
                "error": {"type": "string"},
                "detail": {"type": "string"},
            },
            "required": ["error"],
        }

    # Backup original
    if not BACKUP_PATH.exists():
        BACKUP_PATH.write_text(SPEC_PATH.read_text())
        print(f"\nBackup saved to {BACKUP_PATH}")

    SPEC_PATH.write_text(json.dumps(spec, indent=2))
    print(f"\nDone: added {total_added} response entries across {routes_updated} routes")
    print(f"Wrote {SPEC_PATH}")


if __name__ == "__main__":
    main()
