"""
Receipt Generator.

Cryptographically signed records binding action, context, policy decision,
and outcome. Enables forensic reconstruction and compliance audit trails.

AARM Requirement: R6 (MUST generate cryptographically signed receipts with full context)

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

import hashlib
import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from src.security.mediator import NormalizedAction
from src.security.context import SessionContext
from src.security.policy import PolicyDecisionResult


@dataclass
class ActionReceipt:
    """
    Tamper-evident receipt for an action.

    The ActionReceipt binds together:
    - The action that was evaluated
    - The session context at evaluation time
    - The policy decision
    - The actual outcome (executed, blocked, error, etc.)

    Receipts can be optionally signed with Ed25519 for tamper detection.
    """

    receipt_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    action_id: str = ""
    action_hash: str = ""
    session_id: str = ""

    tool_name: str = ""
    tool_args: dict[str, Any] = field(default_factory=dict)

    agent_id: str = ""
    user_id: str = ""

    policy_decision: str = ""
    policy_rule_id: Optional[str] = None
    policy_rule_name: Optional[str] = None
    decision_reason: str = ""

    outcome: str = ""
    outcome_detail: str = ""

    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    duration_ms: Optional[int] = None

    session_snapshot: Optional[dict[str, Any]] = None
    prior_action_hashes: list[str] = field(default_factory=list)

    signature: Optional[str] = None
    signed_by: Optional[str] = None

    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_signed(self) -> bool:
        return self.signature is not None

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        d = asdict(self)
        d["timestamp"] = self.timestamp.isoformat()
        return d

    def to_json(self) -> str:
        """Serialize to JSON string."""
        return json.dumps(self.to_dict(), sort_keys=True)

    def compute_hash(self) -> str:
        """
        Compute SHA-256 hash of receipt content.

        This hash can be used to verify the receipt hasn't been tampered with.
        """
        canonical = self.to_json()
        return hashlib.sha256(canonical.encode()).hexdigest()


@dataclass
class ReceiptChain:
    """
    Chain of receipts for a session.

    Provides full audit trail by linking receipts via action hashes.
    """

    chain_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = ""
    root_action_hash: Optional[str] = None
    receipts: list[ActionReceipt] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def add_receipt(self, receipt: ActionReceipt) -> None:
        """Add a receipt to the chain."""
        self.receipts.append(receipt)
        self.updated_at = datetime.now(timezone.utc)

        if self.root_action_hash is None:
            self.root_action_hash = receipt.action_hash

    def verify_chain(self) -> tuple[bool, list[str]]:
        """
        Verify the integrity of the receipt chain.

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []

        if not self.receipts:
            return True, []

        for i, receipt in enumerate(self.receipts):
            if i > 0:
                prev_receipt = self.receipts[i - 1]
                if receipt.prior_action_hashes:
                    if prev_receipt.action_hash not in receipt.prior_action_hashes:
                        errors.append(
                            f"Receipt {i}: prior action hash mismatch "
                            f"(expected {prev_receipt.action_hash})"
                        )

        return len(errors) == 0, errors

    def get_receipt(self, receipt_id: str) -> Optional[ActionReceipt]:
        """Get a receipt by ID."""
        for receipt in self.receipts:
            if receipt.receipt_id == receipt_id:
                return receipt
        return None


class ReceiptGenerator:
    """
    Generates tamper-evident receipts for actions.

    The ReceiptGenerator creates signed receipts that prove:
    - What action was evaluated
    - What the policy decision was
    - What the outcome was
    - The state of the session at evaluation time

    Usage:
        generator = ReceiptGenerator()

        # Generate receipt after decision
        receipt = generator.generate(
            action=normalized_action,
            context=session_context,
            decision=policy_result,
            outcome="executed",
        )

        # Sign receipt
        generator.sign(receipt, private_key)

        # Store for audit
        storage.store(receipt)
    """

    def __init__(self):
        self._chains: dict[str, ReceiptChain] = {}
        self._receipts: dict[str, ActionReceipt] = {}

    def generate(
        self,
        action: NormalizedAction,
        context: Optional[SessionContext],
        decision: PolicyDecisionResult,
        outcome: str,
        outcome_detail: str = "",
        duration_ms: Optional[int] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ActionReceipt:
        """
        Generate a receipt for an action.

        Args:
            action: The normalized action
            context: Session context at time of decision
            decision: Policy decision result
            outcome: What actually happened (executed, blocked, error, etc.)
            outcome_detail: Additional outcome details
            duration_ms: Execution duration
            metadata: Additional metadata

        Returns:
            The generated ActionReceipt
        """
        session_snapshot = None
        prior_hashes = []

        if context:
            session_snapshot = {
                "session_id": context.session_id,
                "agent_id": context.agent_id,
                "user_id": context.user_id,
                "tool_call_count": context.tool_call_count,
                "denied_count": context.denied_count,
                "intent_signals": [s.value for s in context.intent_signals],
                "original_request": context.original_request[:500]
                if context.original_request
                else None,
            }
            prior_hashes = context.action_hashes[-10:]

        receipt = ActionReceipt(
            action_id=action.id,
            action_hash=action.action_hash,
            session_id=action.session_id,
            tool_name=action.tool_name,
            tool_args=self._truncate_args(action.tool_args),
            agent_id=action.agent_id,
            user_id=action.user_id,
            policy_decision=decision.decision.value,
            policy_rule_id=decision.rule_id,
            policy_rule_name=decision.rule_name,
            decision_reason=decision.reason,
            outcome=outcome,
            outcome_detail=outcome_detail,
            timestamp=decision.timestamp,
            duration_ms=duration_ms,
            session_snapshot=session_snapshot,
            prior_action_hashes=prior_hashes,
            metadata=metadata or {},
        )

        self._receipts[receipt.receipt_id] = receipt

        chain = self._chains.get(action.session_id)
        if not chain:
            chain = ReceiptChain(session_id=action.session_id)
            self._chains[action.session_id] = chain
        chain.add_receipt(receipt)

        return receipt

    def sign(
        self,
        receipt: ActionReceipt,
        private_key: bytes,
        public_key_id: str = "",
    ) -> str:
        """
        Sign a receipt with Ed25519.

        Args:
            receipt: Receipt to sign
            private_key: Ed25519 private key bytes
            public_key_id: Identifier for the signing key

        Returns:
            The signature as a hex string
        """
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

            if isinstance(private_key, str):
                private_key = bytes.fromhex(private_key)

            key = Ed25519PrivateKey.from_private_bytes(private_key[:32])
            signature = key.sign(receipt.to_json().encode())

            receipt.signature = signature.hex()
            receipt.signed_by = public_key_id

            return signature.hex()

        except ImportError:
            import hmac

            key = hashlib.sha256(private_key).digest()
            signature = hmac.new(key, receipt.to_json().encode(), hashlib.sha256).hexdigest()
            receipt.signature = signature
            receipt.signed_by = public_key_id or "hmac-fallback"
            return signature

    def verify(self, receipt: ActionReceipt) -> tuple[bool, str]:
        """
        Verify a receipt's integrity.

        Args:
            receipt: Receipt to verify

        Returns:
            Tuple of (is_valid, error_message)
        """
        if receipt.signature and receipt.signed_by:
            if receipt.signed_by == "hmac-fallback":
                computed = self._compute_hmac_signature(receipt, receipt.signed_by)
                if computed != receipt.signature:
                    return False, "HMAC signature mismatch"
                return True, ""

            try:
                from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

                public_key_bytes = bytes.fromhex(receipt.signed_by)
                key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
                expected_sig = receipt.signature

                receipt_for_verify = ActionReceipt(
                    receipt_id=receipt.receipt_id,
                    action_id=receipt.action_id,
                    action_hash=receipt.action_hash,
                    session_id=receipt.session_id,
                    tool_name=receipt.tool_name,
                    tool_args=receipt.tool_args,
                    agent_id=receipt.agent_id,
                    user_id=receipt.user_id,
                    policy_decision=receipt.policy_decision,
                    policy_rule_id=receipt.policy_rule_id,
                    policy_rule_name=receipt.policy_rule_name,
                    decision_reason=receipt.decision_reason,
                    outcome=receipt.outcome,
                    outcome_detail=receipt.outcome_detail,
                    timestamp=receipt.timestamp,
                    duration_ms=receipt.duration_ms,
                    session_snapshot=receipt.session_snapshot,
                    prior_action_hashes=receipt.prior_action_hashes,
                    metadata=receipt.metadata,
                )

                key.verify(
                    bytes.fromhex(expected_sig),
                    receipt_for_verify.to_json().encode(),
                )
                return True, ""

            except Exception as e:
                return False, f"Signature verification failed: {e}"

        return True, ""

    def _compute_hmac_signature(self, receipt: ActionReceipt, key_id: str) -> str:
        """Compute HMAC signature (fallback when cryptography unavailable)."""
        import hmac

        key = hashlib.sha256(key_id.encode()).digest()
        return hmac.new(key, receipt.to_json().encode(), hashlib.sha256).hexdigest()

    def get_receipt(self, receipt_id: str) -> Optional[ActionReceipt]:
        """Get a receipt by ID."""
        return self._receipts.get(receipt_id)

    def get_session_chain(self, session_id: str) -> Optional[ReceiptChain]:
        """Get the receipt chain for a session."""
        return self._chains.get(session_id)

    def get_receipts_for_session(self, session_id: str, limit: int = 100) -> list[ActionReceipt]:
        """Get receipts for a session."""
        chain = self._chains.get(session_id)
        if not chain:
            return []
        return chain.receipts[-limit:]

    def _truncate_args(self, args: dict[str, Any], max_length: int = 200) -> dict[str, Any]:
        """Truncate args to prevent oversized receipts."""
        truncated = {}
        for k, v in args.items():
            if isinstance(v, str) and len(v) > max_length:
                truncated[k] = v[:max_length] + "...[truncated]"
            elif isinstance(v, dict):
                truncated[k] = self._truncate_args(v, max_length)
            elif isinstance(v, list):
                truncated[k] = [
                    item[:max_length] + "...[truncated]"
                    if isinstance(item, str) and len(item) > max_length
                    else item
                    for item in v[:10]
                ]
                if len(v) > 10:
                    truncated[k].append(f"...[{len(v) - 10} more items]")
            else:
                truncated[k] = v
        return truncated

    def export_chain(self, session_id: str) -> Optional[dict[str, Any]]:
        """Export a session's receipt chain as JSON-serializable dict."""
        chain = self._chains.get(session_id)
        if not chain:
            return None

        return {
            "chain_id": chain.chain_id,
            "session_id": chain.session_id,
            "root_action_hash": chain.root_action_hash,
            "created_at": chain.created_at.isoformat(),
            "updated_at": chain.updated_at.isoformat(),
            "receipt_count": len(chain.receipts),
            "receipts": [r.to_dict() for r in chain.receipts],
        }
