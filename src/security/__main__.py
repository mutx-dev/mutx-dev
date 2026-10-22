"""Command line verifier: ``python -m mutx_governed_runtime verify chain.json --keys keys.json``."""

import argparse
import json
import sys

from .audit_chain import verify_chain_export


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mutx_governed_runtime")
    sub = parser.add_subparsers(dest="command", required=True)
    verify = sub.add_parser("verify", help="verify an exported audit chain")
    verify.add_argument("chain", help="exported chain JSON file")
    verify.add_argument("--keys", required=True, help='JSON object {"key-id": "<hex public key>"}')
    verify.add_argument("--head", help="externally anchored head hash")
    verify.add_argument("--length", type=int, help="externally anchored entry count")
    args = parser.parse_args(argv)

    try:
        with open(args.chain) as chain_file, open(args.keys) as keys_file:
            chain, keys = json.load(chain_file), json.load(keys_file)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"cannot read input: {exc}", file=sys.stderr)
        return 2
    result = verify_chain_export(chain, keys, expected_head=args.head, expected_length=args.length)
    if result.valid:
        print(f"VALID entries={result.length} head={result.head}")
        return 0
    print(f"INVALID entries={result.length}")
    for error in result.errors:
        print(f"  {error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
