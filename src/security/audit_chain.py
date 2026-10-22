"""
Hash-linked, signature-bound audit chain.

Every entry commits to its predecessor's hash and carries an Ed25519-signed
receipt whose signed metadata records the entry's position and predecessor.
Editing, deleting, inserting, reordering, duplicating or splicing entries
therefore breaks either a hash link or a signature, and an attacker without
the signing key cannot repair either.

Truncating the tail of a chain leaves a valid shorter chain. It is only
detectable against an externally held head hash or length, which callers pass
to ``verify_chain_export`` as ``expected_head`` / ``expected_length``.
"""

import hashlib
import json
from collections.abc import Mapping
from dataclasses import dataclass, field, fields
from datetime import datetime
from typing import Any, Optional

from .receipts import ActionReceipt, ReceiptGenerator, TrustedPublicKeys

GENESIS_HASH = "0" * 64
EXPORT_VERSION = 1
_RECEIPT_FIELDS = frozenset(f.name for f in fields(ActionReceipt))
_ENTRY_KEYS = frozenset({"index", "prev_hash", "entry_hash", "receipt"})
_EXPORT_KEYS = frozenset({"version", "session_id", "head", "entries"})


def entry_hash(index: int, prev_hash: str, receipt: Mapping[str, Any]) -> str:
    """Hash an entry's position, predecessor and full receipt content."""
    canonical = json.dumps(
        {"index": index, "prev_hash": prev_hash, "receipt": receipt},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()


@dataclass(frozen=True)
class ChainVerification:
    """Outcome of verifying an exported chain."""

    valid: bool
    length: int
    head: str
    errors: list[str] = field(default_factory=list)


class AuditChain:
    """Append-only chain of signed receipts for one session."""

    def __init__(self, session_id: str, signer: ReceiptGenerator) -> None:
        if not session_id:
            raise ValueError("Audit chain requires a session ID")
        self.session_id = session_id
        self._signer = signer
        self._entries: list[dict[str, Any]] = []

    @property
    def head(self) -> str:
        return self._entries[-1]["entry_hash"] if self._entries else GENESIS_HASH

    def __len__(self) -> int:
        return len(self._entries)

    def append(self, receipt: ActionReceipt) -> str:
        """Bind a receipt to the chain position, sign it and append it."""
        if receipt.session_id != self.session_id:
            raise ValueError("Receipt session does not match the chain session")
        index = len(self._entries)
        prev_hash = self.head
        receipt.metadata = {
            **receipt.metadata,
            "chain": {"session_id": self.session_id, "index": index, "prev_hash": prev_hash},
        }
        if self._signer.sign_for_persistence(receipt) is None:
            raise ValueError("Audit chain entries must be signed by a platform key")
        body = json.loads(receipt.to_json())
        digest = entry_hash(index, prev_hash, body)
        self._entries.append(
            {"index": index, "prev_hash": prev_hash, "entry_hash": digest, "receipt": body}
        )
        return digest

    def export(self) -> dict[str, Any]:
        return {
            "version": EXPORT_VERSION,
            "session_id": self.session_id,
            "head": self.head,
            "entries": json.loads(json.dumps(self._entries)),
        }

    @classmethod
    def load(
        cls,
        exported: Mapping[str, Any],
        signer: ReceiptGenerator,
        trusted_public_keys: TrustedPublicKeys,
    ) -> "AuditChain":
        """Restore a chain for further appends, refusing anything that fails verification."""
        result = verify_chain_export(exported, trusted_public_keys)
        if not result.valid:
            raise ValueError(f"Refusing to load invalid chain: {result.errors[0]}")
        chain = cls(exported["session_id"], signer)
        chain._entries = json.loads(json.dumps(exported["entries"]))
        return chain


def _receipt_from_dict(raw: Mapping[str, Any]) -> ActionReceipt:
    unknown = set(raw) - _RECEIPT_FIELDS
    if unknown:
        raise ValueError(f"unknown receipt fields {sorted(unknown)}")
    values = dict(raw)
    values["timestamp"] = datetime.fromisoformat(values["timestamp"])
    return ActionReceipt(**values)


def verify_chain_export(
    exported: Any,
    trusted_public_keys: TrustedPublicKeys,
    *,
    expected_head: Optional[str] = None,
    expected_length: Optional[int] = None,
) -> ChainVerification:
    """
    Verify an exported chain without trusting any of its contents.

    Every problem found is reported, not only the first. ``expected_head`` and
    ``expected_length`` are the externally anchored values that make tail
    truncation detectable.
    """
    if not isinstance(exported, Mapping) or set(exported) != _EXPORT_KEYS:
        return ChainVerification(False, 0, GENESIS_HASH, ["export has the wrong shape"])
    entries = exported["entries"]
    if not isinstance(entries, list):
        return ChainVerification(False, 0, GENESIS_HASH, ["entries must be a list"])
    errors: list[str] = []
    if exported["version"] != EXPORT_VERSION:
        errors.append(f"unsupported export version {exported['version']!r}")

    verifier = ReceiptGenerator(trusted_public_keys=trusted_public_keys)
    session_id = exported["session_id"]
    prev = GENESIS_HASH
    seen_receipts: set[str] = set()

    for position, entry in enumerate(entries):
        label = f"entry {position}"
        if not isinstance(entry, Mapping) or set(entry) != _ENTRY_KEYS:
            errors.append(f"{label}: wrong shape")
            continue
        if entry["index"] != position:
            errors.append(f"{label}: index is {entry['index']!r}")
        if entry["prev_hash"] != prev:
            errors.append(f"{label}: prev_hash does not match the preceding entry")
        receipt_body = entry["receipt"]
        try:
            recomputed = entry_hash(entry["index"], entry["prev_hash"], receipt_body)
        except (TypeError, ValueError):
            errors.append(f"{label}: receipt is not canonical JSON")
            prev = str(entry["entry_hash"])
            continue
        if entry["entry_hash"] != recomputed:
            errors.append(f"{label}: entry_hash does not match content")
        prev = str(entry["entry_hash"])

        try:
            receipt = _receipt_from_dict(receipt_body)
        except (TypeError, ValueError, KeyError) as exc:
            errors.append(f"{label}: malformed receipt ({exc})")
            continue
        if receipt.receipt_id in seen_receipts:
            errors.append(f"{label}: duplicate receipt_id")
        seen_receipts.add(receipt.receipt_id)
        if receipt.session_id != session_id:
            errors.append(f"{label}: receipt belongs to another session")
        if not receipt.signer_key_id or receipt.signed_by != receipt.signer_key_id:
            errors.append(f"{label}: receipt lacks a bound signer key ID")
        else:
            ok, reason = verifier.verify(receipt)
            if not ok:
                errors.append(f"{label}: {reason}")
        expected_binding = {
            "session_id": session_id,
            "index": position,
            "prev_hash": entry["prev_hash"],
        }
        if receipt.metadata.get("chain") != expected_binding:
            errors.append(f"{label}: signed chain position does not match")

    if exported["head"] != prev:
        errors.append("head does not match the last entry")
    if expected_head is not None and prev != expected_head:
        errors.append("head does not match the anchored head (entries removed or altered)")
    if expected_length is not None and len(entries) != expected_length:
        errors.append(f"chain length is {len(entries)}, anchored length is {expected_length}")
    return ChainVerification(not errors, len(entries), prev, errors)
