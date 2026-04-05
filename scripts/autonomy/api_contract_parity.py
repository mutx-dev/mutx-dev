#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.generate_openapi import build_openapi_document  # noqa: E402


HTTP_METHODS = {
    "delete",
    "get",
    "head",
    "options",
    "patch",
    "post",
    "put",
    "trace",
}
DOCS_DIR = PROJECT_ROOT / "docs" / "api"
SNAPSHOT_PATH = DOCS_DIR / "openapi.json"
PROSE_DOC_EXCLUDES = {"reference.md"}
IGNORED_UNDOCUMENTED_PATHS = {"/"}
ROUTE_REFERENCE_RE = re.compile(
    r"(?<![A-Za-z0-9_])(/(?:v1|health|ready|metrics)(?:/[A-Za-z0-9{}._:*:-]+)*/?)"
)


def load_openapi_document(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def normalize_known_path(path: str) -> str:
    if path != "/" and path.endswith("/"):
        return path[:-1]
    return path


def normalize_route_reference(reference: str) -> tuple[str, bool]:
    is_family = reference.endswith("*")
    if is_family:
        reference = reference[:-1]
    return normalize_known_path(reference), is_family


def extract_path_operations(document: dict[str, Any]) -> dict[str, list[str]]:
    operations: dict[str, list[str]] = {}
    for path, definition in document.get("paths", {}).items():
        methods = sorted(
            method.upper()
            for method in definition
            if isinstance(method, str) and method.lower() in HTTP_METHODS
        )
        operations[path] = methods
    return operations


def diff_named_contracts(
    snapshot_items: dict[str, Any],
    live_items: dict[str, Any],
) -> dict[str, list[str]]:
    snapshot_names = set(snapshot_items)
    live_names = set(live_items)
    shared_names = snapshot_names & live_names

    return {
        "missing_in_snapshot": sorted(live_names - snapshot_names),
        "extra_in_snapshot": sorted(snapshot_names - live_names),
        "changed": sorted(
            name
            for name in shared_names
            if canonical_json(snapshot_items[name]) != canonical_json(live_items[name])
        ),
    }


def collect_method_mismatches(
    snapshot_document: dict[str, Any],
    live_document: dict[str, Any],
) -> list[dict[str, Any]]:
    snapshot_operations = extract_path_operations(snapshot_document)
    live_operations = extract_path_operations(live_document)
    mismatches: list[dict[str, Any]] = []

    for path in sorted(set(snapshot_operations) & set(live_operations)):
        if snapshot_operations[path] != live_operations[path]:
            mismatches.append(
                {
                    "path": path,
                    "snapshot_methods": snapshot_operations[path],
                    "live_methods": live_operations[path],
                }
            )

    return mismatches


def iter_route_references(path: Path) -> Iterable[dict[str, Any]]:
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        for match in ROUTE_REFERENCE_RE.finditer(line):
            yield {
                "doc": display_path(path),
                "line": line_number,
                "reference": match.group(1),
            }


def display_path(path: Path) -> str:
    try:
        return path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def classify_route_reference(
    reference: str,
    normalized_openapi_paths: set[str],
) -> tuple[str, str]:
    normalized_reference, is_family_reference = normalize_route_reference(reference)

    # Ignore very broad prose like `/v1/*`; it is useful narration, not route coverage.
    if normalized_reference in {"/v1"}:
        return "ignored", normalized_reference

    if not is_family_reference and normalized_reference in normalized_openapi_paths:
        return "exact", normalized_reference

    if normalized_reference.startswith("/v1") and any(
        path == normalized_reference or path.startswith(f"{normalized_reference}/")
        for path in normalized_openapi_paths
    ):
        return "family", normalized_reference

    if normalized_reference in normalized_openapi_paths:
        return "exact", normalized_reference

    return "unknown", normalized_reference


def collect_prose_coverage(
    snapshot_document: dict[str, Any],
    docs_dir: Path = DOCS_DIR,
) -> dict[str, Any]:
    snapshot_paths = sorted(snapshot_document.get("paths", {}))
    normalized_openapi_paths = {normalize_known_path(path) for path in snapshot_paths}
    exact_routes: set[str] = set()
    family_routes: set[str] = set()
    stale_references: list[dict[str, Any]] = []
    ignored_references: list[dict[str, Any]] = []

    for path in sorted(docs_dir.glob("*.md")):
        if path.name in PROSE_DOC_EXCLUDES:
            continue
        for entry in iter_route_references(path):
            kind, target = classify_route_reference(entry["reference"], normalized_openapi_paths)
            if kind == "exact":
                exact_routes.add(target)
                continue
            if kind == "family":
                family_routes.add(target)
                continue
            entry = {**entry, "target": target}
            if kind == "ignored":
                ignored_references.append(entry)
            else:
                stale_references.append(entry)

    covered_paths = [
        path
        for path in snapshot_paths
        if normalize_known_path(path) in exact_routes
        or any(
            normalize_known_path(path) == family
            or normalize_known_path(path).startswith(f"{family}/")
            for family in family_routes
        )
    ]
    undocumented_paths = [
        path
        for path in snapshot_paths
        if path not in covered_paths and path not in IGNORED_UNDOCUMENTED_PATHS
    ]

    return {
        "covered_paths": covered_paths,
        "undocumented_paths": undocumented_paths,
        "stale_references": stale_references,
        "ignored_references": ignored_references,
        "family_routes": sorted(family_routes),
        "exact_routes": sorted(exact_routes),
    }


def build_parity_report(
    snapshot_document: dict[str, Any],
    live_document: dict[str, Any],
    docs_dir: Path = DOCS_DIR,
    snapshot_path: Path = SNAPSHOT_PATH,
) -> dict[str, Any]:
    snapshot_vs_live = {
        "paths": diff_named_contracts(
            snapshot_document.get("paths", {}),
            live_document.get("paths", {}),
        ),
        "schemas": diff_named_contracts(
            snapshot_document.get("components", {}).get("schemas", {}),
            live_document.get("components", {}).get("schemas", {}),
        ),
        "method_mismatches": collect_method_mismatches(snapshot_document, live_document),
    }
    prose_vs_snapshot = collect_prose_coverage(snapshot_document=snapshot_document, docs_dir=docs_dir)

    is_clean = all(not snapshot_vs_live["paths"][key] for key in snapshot_vs_live["paths"]) and all(
        not snapshot_vs_live["schemas"][key] for key in snapshot_vs_live["schemas"]
    )
    is_clean = is_clean and not snapshot_vs_live["method_mismatches"]
    is_clean = is_clean and not prose_vs_snapshot["undocumented_paths"]
    is_clean = is_clean and not prose_vs_snapshot["stale_references"]

    return {
        "is_clean": is_clean,
        "snapshot_path": display_path(snapshot_path),
        "docs_dir": display_path(docs_dir),
        "snapshot_vs_live": snapshot_vs_live,
        "prose_vs_snapshot": prose_vs_snapshot,
    }


def collect_contract_parity_report(
    snapshot_path: Path = SNAPSHOT_PATH,
    docs_dir: Path = DOCS_DIR,
) -> dict[str, Any]:
    snapshot_document = load_openapi_document(snapshot_path)
    try:
        live_document = build_openapi_document()
    except ModuleNotFoundError as exc:
        missing_dependency = exc.name or str(exc)
        raise RuntimeError(
            "Unable to build the live OpenAPI document because a backend dependency is "
            f"missing: {missing_dependency}. Install the MUTX backend dependencies and "
            "rerun the checker."
        ) from exc
    return build_parity_report(
        snapshot_document=snapshot_document,
        live_document=live_document,
        docs_dir=docs_dir,
        snapshot_path=snapshot_path,
    )


def format_entry_list(title: str, values: Iterable[str]) -> list[str]:
    values = list(values)
    if not values:
        return [f"{title}: none"]
    lines = [f"{title} ({len(values)}):"]
    lines.extend(f"  - {value}" for value in values)
    return lines


def format_reference_list(title: str, entries: list[dict[str, Any]]) -> list[str]:
    if not entries:
        return [f"{title}: none"]
    lines = [f"{title} ({len(entries)}):"]
    lines.extend(
        f"  - {entry['doc']}:{entry['line']} -> {entry['reference']}"
        for entry in entries
    )
    return lines


def format_method_mismatches(entries: list[dict[str, Any]]) -> list[str]:
    if not entries:
        return ["Path method mismatches: none"]
    lines = [f"Path method mismatches ({len(entries)}):"]
    lines.extend(
        "  - "
        + f"{entry['path']} snapshot={entry['snapshot_methods']} live={entry['live_methods']}"
        for entry in entries
    )
    return lines


def format_text_report(report: dict[str, Any]) -> str:
    snapshot_vs_live = report["snapshot_vs_live"]
    prose_vs_snapshot = report["prose_vs_snapshot"]
    lines = [
        "API contract parity: "
        + ("clean" if report["is_clean"] else "drift detected"),
        f"Snapshot: {report['snapshot_path']}",
        f"Docs: {report['docs_dir']}",
        "",
        "Snapshot vs live app",
    ]
    lines.extend(
        format_entry_list("Paths missing in snapshot", snapshot_vs_live["paths"]["missing_in_snapshot"])
    )
    lines.extend(format_entry_list("Extra paths in snapshot", snapshot_vs_live["paths"]["extra_in_snapshot"]))
    lines.extend(format_entry_list("Changed path contracts", snapshot_vs_live["paths"]["changed"]))
    lines.extend(
        format_entry_list("Schemas missing in snapshot", snapshot_vs_live["schemas"]["missing_in_snapshot"])
    )
    lines.extend(
        format_entry_list("Extra schemas in snapshot", snapshot_vs_live["schemas"]["extra_in_snapshot"])
    )
    lines.extend(format_entry_list("Changed schemas", snapshot_vs_live["schemas"]["changed"]))
    lines.extend(format_method_mismatches(snapshot_vs_live["method_mismatches"]))
    lines.extend(
        [
            "",
            "Prose docs vs snapshot",
            f"Covered snapshot paths: {len(prose_vs_snapshot['covered_paths'])}",
        ]
    )
    lines.extend(
        format_entry_list("Undocumented snapshot paths", prose_vs_snapshot["undocumented_paths"])
    )
    lines.extend(format_reference_list("Stale prose route references", prose_vs_snapshot["stale_references"]))

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compare the live FastAPI surface against docs/api/openapi.json and "
            "flag prose coverage drift in docs/api/*.md."
        )
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format for the report.",
    )
    parser.add_argument(
        "--snapshot",
        type=Path,
        default=SNAPSHOT_PATH,
        help="Path to the checked-in OpenAPI snapshot.",
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=DOCS_DIR,
        help="Directory containing prose API docs to scan.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        report = collect_contract_parity_report(
            snapshot_path=args.snapshot,
            docs_dir=args.docs_dir,
        )
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.format == "json":
        print(json.dumps(report, indent=2))
    else:
        print(format_text_report(report))

    return 0 if report["is_clean"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
