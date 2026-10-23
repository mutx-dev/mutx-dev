"""Tamper-evidence suite: every adversarial edit of an exported audit chain must be detected."""

import json
from copy import deepcopy
from typing import Any, Callable

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from src.security import AuditChain, verify_chain_export
from src.security.__main__ import main as cli_main
from src.security.audit_chain import GENESIS_HASH, entry_hash
from src.security.receipts import ActionReceipt, ReceiptGenerator, ReceiptSigningError

KEY_ID = "platform-2026"
OTHER_KEY_ID = "attacker-2026"
SESSION = "session-1"
LENGTH = 5


def _keypair() -> tuple[bytes, bytes]:
    private = Ed25519PrivateKey.generate()
    raw = private.private_bytes_raw()
    return raw, ReceiptGenerator.public_key_bytes(raw)


PRIVATE, PUBLIC = _keypair()
ATTACKER_PRIVATE, ATTACKER_PUBLIC = _keypair()
TRUSTED = {KEY_ID: PUBLIC}


def _signer(private: bytes = PRIVATE, key_id: str = KEY_ID, public: bytes = PUBLIC):
    return ReceiptGenerator(
        signing_private_key=private,
        signing_key_id=key_id,
        trusted_public_keys={key_id: public},
        signing_required=True,
    )


def _receipt(n: int) -> ActionReceipt:
    return ActionReceipt(
        receipt_id=f"receipt-{n}",
        action_id=f"action-{n}",
        action_hash=f"hash-{n}",
        session_id=SESSION,
        tool_name="send_money" if n % 2 else "get_balance",
        tool_args={"n": n},
        policy_decision="deny" if n % 2 else "allow",
        outcome="blocked" if n % 2 else "executed",
    )


def _build(length: int = LENGTH) -> AuditChain:
    chain = AuditChain(SESSION, _signer())
    for n in range(length):
        chain.append(_receipt(n))
    return chain


@pytest.fixture()
def chain() -> AuditChain:
    return _build()


@pytest.fixture()
def export(chain: AuditChain) -> dict[str, Any]:
    return chain.export()


def _rehash(exported: dict[str, Any]) -> dict[str, Any]:
    """Recompute every hash link, as an attacker without the signing key could."""
    prev = GENESIS_HASH
    for position, entry in enumerate(exported["entries"]):
        entry["index"], entry["prev_hash"] = position, prev
        entry["entry_hash"] = entry_hash(position, prev, entry["receipt"])
        prev = entry["entry_hash"]
    exported["head"] = prev
    return exported


def test_untouched_chain_verifies(export, chain):
    result = verify_chain_export(export, TRUSTED, expected_head=chain.head, expected_length=LENGTH)
    assert result.valid, result.errors
    assert result.length == LENGTH
    assert result.head == chain.head


def test_export_survives_json_round_trip(export):
    assert verify_chain_export(json.loads(json.dumps(export)), TRUSTED).valid


def test_empty_chain_verifies():
    assert verify_chain_export(_build(0).export(), TRUSTED).valid


def test_loaded_chain_can_be_extended_and_still_verifies(export):
    restored = AuditChain.load(export, _signer(), TRUSTED)
    restored.append(_receipt(LENGTH))
    assert verify_chain_export(restored.export(), TRUSTED).valid


def test_load_refuses_a_tampered_chain(export):
    export["entries"][1]["receipt"]["outcome"] = "executed"
    with pytest.raises(ValueError):
        AuditChain.load(export, _signer(), TRUSTED)


def test_unsigned_receipts_cannot_be_appended():
    chain = AuditChain(SESSION, ReceiptGenerator())
    with pytest.raises(ValueError):
        chain.append(_receipt(0))


def test_signing_required_generator_fails_closed():
    chain = AuditChain(SESSION, ReceiptGenerator(signing_required=True))
    with pytest.raises(ReceiptSigningError):
        chain.append(_receipt(0))


def test_receipt_from_another_session_is_rejected_on_append(chain):
    foreign = _receipt(9)
    foreign.session_id = "session-2"
    with pytest.raises(ValueError):
        chain.append(foreign)


# Each mutation edits an exported chain the way an attacker with write access to the log would.


def _edit_decision(e):
    e["entries"][1]["receipt"]["policy_decision"] = "allow"


def _edit_tool_args(e):
    e["entries"][1]["receipt"]["tool_args"] = {"n": 999}


def _edit_outcome_and_rehash(e):
    e["entries"][3]["receipt"]["outcome"] = "executed"
    _rehash(e)


def _edit_signed_field_without_rehash_of_later_entries(e):
    e["entries"][0]["receipt"]["decision_reason"] = "rewritten"
    e["entries"][0]["entry_hash"] = entry_hash(0, GENESIS_HASH, e["entries"][0]["receipt"])


def _edit_entry_hash(e):
    e["entries"][2]["entry_hash"] = "f" * 64


def _edit_prev_hash(e):
    e["entries"][2]["prev_hash"] = "f" * 64


def _edit_head(e):
    e["head"] = "f" * 64


def _edit_index(e):
    e["entries"][1]["index"] = 7


def _swap_adjacent(e):
    e["entries"][1], e["entries"][2] = e["entries"][2], e["entries"][1]


def _swap_adjacent_and_rehash(e):
    _swap_adjacent(e)
    _rehash(e)


def _reverse(e):
    e["entries"].reverse()


def _reverse_and_rehash(e):
    _reverse(e)
    _rehash(e)


def _delete_first(e):
    del e["entries"][0]


def _delete_first_and_rehash(e):
    _delete_first(e)
    _rehash(e)


def _delete_middle(e):
    del e["entries"][2]


def _delete_middle_and_rehash(e):
    _delete_middle(e)
    _rehash(e)


def _delete_last_and_fix_head(e):
    del e["entries"][-1]
    e["head"] = e["entries"][-1]["entry_hash"]


def _insert_forged_unsigned(e):
    forged = _receipt(50)
    body = json.loads(forged.to_json())
    e["entries"].insert(2, {"index": 2, "prev_hash": "", "entry_hash": "", "receipt": body})
    _rehash(e)


def _insert_forged_signed_by_attacker(e):
    attacker = _signer(ATTACKER_PRIVATE, KEY_ID, ATTACKER_PUBLIC)
    forged = _receipt(50)
    forged.metadata = {"chain": {"session_id": SESSION, "index": 2, "prev_hash": "x"}}
    attacker.sign_for_persistence(forged)
    body = json.loads(forged.to_json())
    e["entries"].insert(2, {"index": 2, "prev_hash": "", "entry_hash": "", "receipt": body})
    _rehash(e)


def _duplicate_entry(e):
    e["entries"].insert(3, deepcopy(e["entries"][2]))


def _duplicate_entry_and_rehash(e):
    _duplicate_entry(e)
    _rehash(e)


def _replay_old_entry_at_end(e):
    e["entries"].append(deepcopy(e["entries"][1]))
    _rehash(e)


def _splice_from_other_chain(e):
    other = _build().export()
    e["entries"][2] = other["entries"][2]
    _rehash(e)


def _replace_with_other_session(e):
    other = AuditChain("session-2", _signer())
    for n in range(LENGTH):
        r = _receipt(n)
        r.session_id = "session-2"
        other.append(r)
    e["entries"] = other.export()["entries"]
    e["head"] = other.head


def _forge_whole_chain_with_attacker_key(e):
    forged = AuditChain(SESSION, _signer(ATTACKER_PRIVATE, KEY_ID, ATTACKER_PUBLIC))
    for n in range(LENGTH):
        forged.append(_receipt(n))
    e.update(forged.export())


def _forge_whole_chain_with_untrusted_key_id(e):
    forged = AuditChain(SESSION, _signer(ATTACKER_PRIVATE, OTHER_KEY_ID, ATTACKER_PUBLIC))
    for n in range(LENGTH):
        forged.append(_receipt(n))
    e.update(forged.export())


def _swap_key_id_to_untrusted(e):
    r = e["entries"][2]["receipt"]
    r["signer_key_id"] = r["signed_by"] = OTHER_KEY_ID
    _rehash(e)


def _desync_signer_fields(e):
    e["entries"][2]["receipt"]["signed_by"] = "someone-else"
    _rehash(e)


def _drop_signer_key_id(e):
    e["entries"][2]["receipt"]["signer_key_id"] = None
    _rehash(e)


def _strip_signature(e):
    e["entries"][2]["receipt"]["signature"] = None
    _rehash(e)


def _empty_signature(e):
    e["entries"][2]["receipt"]["signature"] = ""
    _rehash(e)


def _malformed_signature(e):
    e["entries"][2]["receipt"]["signature"] = "zz" * 64
    _rehash(e)


def _short_signature(e):
    e["entries"][2]["receipt"]["signature"] = "ab" * 10
    _rehash(e)


def _flip_signature_bit(e):
    sig = e["entries"][2]["receipt"]["signature"]
    e["entries"][2]["receipt"]["signature"] = ("0" if sig[0] != "0" else "1") + sig[1:]
    _rehash(e)


def _copy_signature_from_other_entry(e):
    e["entries"][2]["receipt"]["signature"] = e["entries"][1]["receipt"]["signature"]
    _rehash(e)


def _hmac_fallback(e):
    r = e["entries"][2]["receipt"]
    r["signer_key_id"] = r["signed_by"] = "hmac-fallback"
    _rehash(e)


def _rewrite_chain_binding(e):
    e["entries"][2]["receipt"]["metadata"]["chain"]["index"] = 0
    _rehash(e)


def _strip_chain_binding(e):
    e["entries"][2]["receipt"]["metadata"].pop("chain")
    _rehash(e)


def _change_receipt_session(e):
    e["entries"][2]["receipt"]["session_id"] = "session-2"
    _rehash(e)


def _unknown_receipt_field(e):
    e["entries"][2]["receipt"]["extra"] = "smuggled"
    _rehash(e)


def _garbage_timestamp(e):
    e["entries"][2]["receipt"]["timestamp"] = "yesterday"
    _rehash(e)


def _add_entry_field(e):
    e["entries"][2]["note"] = "smuggled"


def _add_top_level_field(e):
    e["extra"] = 1


def _wrong_version(e):
    e["version"] = 2


def _entries_not_a_list(e):
    e["entries"] = {"0": e["entries"][0]}


def _entry_not_a_mapping(e):
    e["entries"][2] = "entry"


def _non_json_receipt(e):
    e["entries"][2]["receipt"]["tool_args"] = {1, 2}


DETECTED: dict[str, Callable[[dict[str, Any]], None]] = {
    "edit policy decision": _edit_decision,
    "edit tool args": _edit_tool_args,
    "edit outcome and recompute hashes": _edit_outcome_and_rehash,
    "edit first receipt and fix only its hash": _edit_signed_field_without_rehash_of_later_entries,
    "edit entry_hash": _edit_entry_hash,
    "edit prev_hash": _edit_prev_hash,
    "edit head": _edit_head,
    "edit index": _edit_index,
    "swap adjacent entries": _swap_adjacent,
    "swap adjacent entries and recompute hashes": _swap_adjacent_and_rehash,
    "reverse the chain": _reverse,
    "reverse the chain and recompute hashes": _reverse_and_rehash,
    "delete first entry": _delete_first,
    "delete first entry and recompute hashes": _delete_first_and_rehash,
    "delete middle entry": _delete_middle,
    "delete middle entry and recompute hashes": _delete_middle_and_rehash,
    "insert forged unsigned entry": _insert_forged_unsigned,
    "insert entry signed with an attacker key": _insert_forged_signed_by_attacker,
    "duplicate an entry": _duplicate_entry,
    "duplicate an entry and recompute hashes": _duplicate_entry_and_rehash,
    "replay an old entry at the end": _replay_old_entry_at_end,
    "splice an entry from another chain": _splice_from_other_chain,
    "substitute another session's chain": _replace_with_other_session,
    "forge the chain with an attacker key under the trusted key ID": (
        _forge_whole_chain_with_attacker_key
    ),
    "forge the chain under an untrusted key ID": _forge_whole_chain_with_untrusted_key_id,
    "swap signer key ID to an untrusted one": _swap_key_id_to_untrusted,
    "desynchronise signed_by and signer_key_id": _desync_signer_fields,
    "drop signer_key_id": _drop_signer_key_id,
    "strip signature": _strip_signature,
    "empty signature": _empty_signature,
    "malformed signature": _malformed_signature,
    "short signature": _short_signature,
    "flip a signature bit": _flip_signature_bit,
    "copy a signature from another entry": _copy_signature_from_other_entry,
    "hmac fallback signer": _hmac_fallback,
    "rewrite signed chain index": _rewrite_chain_binding,
    "strip signed chain binding": _strip_chain_binding,
    "change receipt session": _change_receipt_session,
    "unknown receipt field": _unknown_receipt_field,
    "garbage timestamp": _garbage_timestamp,
    "extra entry field": _add_entry_field,
    "extra top-level field": _add_top_level_field,
    "wrong export version": _wrong_version,
    "entries not a list": _entries_not_a_list,
    "entry not a mapping": _entry_not_a_mapping,
}


@pytest.mark.parametrize("name", sorted(DETECTED))
def test_tamper_is_detected(name, export):
    DETECTED[name](export)
    result = verify_chain_export(export, TRUSTED)
    assert not result.valid, f"undetected: {name}"
    assert result.errors


def test_non_json_receipt_is_reported_not_raised(export):
    _non_json_receipt(export)
    assert not verify_chain_export(export, TRUSTED).valid


@pytest.mark.parametrize("junk", [None, [], "chain", 7, {}])
def test_non_mapping_or_wrong_shape_export_is_invalid(junk):
    assert not verify_chain_export(junk, TRUSTED).valid


def test_truncation_needs_an_external_anchor(export, chain):
    """Documented limit: dropping tail entries yields a valid shorter chain."""
    anchored_head, anchored_length = chain.head, len(chain)
    del export["entries"][-2:]
    export["head"] = export["entries"][-1]["entry_hash"]
    assert verify_chain_export(export, TRUSTED).valid
    by_head = verify_chain_export(export, TRUSTED, expected_head=anchored_head)
    by_length = verify_chain_export(export, TRUSTED, expected_length=anchored_length)
    assert not by_head.valid
    assert not by_length.valid


def test_truncating_to_empty_is_detected_with_an_anchor(export, chain):
    export["entries"] = []
    export["head"] = GENESIS_HASH
    assert not verify_chain_export(export, TRUSTED, expected_head=chain.head).valid


def test_trusted_registry_without_the_signer_rejects_everything(export):
    assert not verify_chain_export(export, {"other": ATTACKER_PUBLIC}).valid


def test_all_errors_are_reported_not_just_the_first(export):
    export["entries"][1]["receipt"]["outcome"] = "x"
    export["entries"][3]["receipt"]["outcome"] = "y"
    errors = verify_chain_export(export, TRUSTED).errors
    assert any(e.startswith("entry 1:") for e in errors)
    assert any(e.startswith("entry 3:") for e in errors)


def test_cli_accepts_a_valid_chain_and_rejects_a_tampered_one(tmp_path, export, chain, capsys):
    keys = tmp_path / "keys.json"
    keys.write_text(json.dumps({KEY_ID: PUBLIC.hex()}))
    good = tmp_path / "good.json"
    good.write_text(json.dumps(export))
    assert cli_main(["verify", str(good), "--keys", str(keys), "--head", chain.head]) == 0
    assert capsys.readouterr().out.startswith("VALID")

    export["entries"][1]["receipt"]["policy_decision"] = "allow"
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps(export))
    assert cli_main(["verify", str(bad), "--keys", str(keys)]) == 1
    assert capsys.readouterr().out.startswith("INVALID")

    assert cli_main(["verify", str(tmp_path / "missing.json"), "--keys", str(keys)]) == 2
