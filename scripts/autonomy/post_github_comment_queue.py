from __future__ import annotations

import os

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

DEFAULT_QUEUE_DIR = Path(".autonomy/github-comment-queue")


def run_gh(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["gh", *args], text=True, capture_output=True)


def iter_queue_files(queue_dir: Path) -> list[Path]:
    if not queue_dir.exists():
        return []
    return sorted(p for p in queue_dir.glob("*.json") if p.is_file())


def load_payload(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def post_comment(payload: dict[str, Any]) -> subprocess.CompletedProcess[str]:
    repo = str(payload.get("repo") or "").strip()
    pr = str(payload.get("pr") or "").strip()
    body = str(payload.get("body") or "").strip()
    if not repo or not pr or not body:
        raise RuntimeError("queue item missing repo, pr, or body")
    return run_gh(["pr", "comment", pr, "--repo", repo, "--body", body])


def main() -> int:
    parser = argparse.ArgumentParser(description="Post queued GitHub comments with valid auth")
    parser.add_argument("--queue-dir", default=str(DEFAULT_QUEUE_DIR))
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    if Path.home().joinpath(".config/gh/hosts.yml").exists() is False and not os.environ.get("GH_TOKEN"):
        print(json.dumps({"posted": 0, "error": "no github auth found"}, indent=2))
        return 1

    queue_dir = Path(args.queue_dir)
    files = iter_queue_files(queue_dir)
    if not files:
        print(json.dumps({"posted": 0, "queue_dir": str(queue_dir)}, indent=2))
        return 0

    posted = 0
    for path in files:
        payload = load_payload(path)
        result = post_comment(payload)
        if result.returncode != 0:
            print(json.dumps({"posted": posted, "failed": str(path), "stderr": result.stderr.strip()}, indent=2))
            return result.returncode
        path.unlink(missing_ok=True)
        posted += 1
        if args.once:
            break

    print(json.dumps({"posted": posted, "queue_dir": str(queue_dir)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
