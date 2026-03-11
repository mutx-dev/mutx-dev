from __future__ import annotations

import argparse
import json
from pathlib import Path


def build_prompt(agent: str, brief: str, work_order: dict) -> str:
    return "\n".join(
        [
            f"You are `{agent}` working inside the MUTX repository.",
            "",
            "Follow the agent brief below and produce the smallest correct implementation.",
            "If you are connected to a coding model wrapper, use this prompt as the task input.",
            "",
            "## Work Order",
            json.dumps(work_order, indent=2, sort_keys=True),
            "",
            "## Brief",
            brief,
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a GitHub-hosted prompt bundle for a MUTX work order")
    parser.add_argument("--agent", required=True)
    parser.add_argument("--brief", required=True)
    parser.add_argument("--work-order", required=True)
    parser.add_argument(
        "--output",
        default=".autonomy/prompts/latest.md",
        help="Where to write the prompt artifact",
    )
    args = parser.parse_args()

    brief_text = Path(args.brief).read_text()
    work_order = json.loads(Path(args.work_order).read_text())
    prompt = build_prompt(args.agent, brief_text, work_order)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(prompt)
    print(f"Prompt artifact written to {output_path}")
    print("Replace this wrapper with your model invocation, or call it from AUTONOMY_AGENT_CMD_TEMPLATE.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
