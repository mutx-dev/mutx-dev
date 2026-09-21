import base64
import hashlib

import bcrypt
import pytest

from src.api.auth.password import hash_password, verify_password


def test_new_passwords_use_argon2id():
    hashed = hash_password("StrongPassword123!")
    assert hashed.startswith("$argon2id$")
    assert verify_password("StrongPassword123!", hashed)
    assert not verify_password("WrongPassword123!", hashed)


def test_legacy_bcrypt_still_verifies():
    legacy = bcrypt.hashpw(b"StrongPassword123!", bcrypt.gensalt()).decode()
    assert verify_password("StrongPassword123!", legacy)
    assert not verify_password("WrongPassword123!", legacy)


def test_legacy_pbkdf2_still_verifies_without_passlib():
    def encode(value):
        return base64.b64encode(value).decode().rstrip("=").replace("+", ".")

    salt = b"legacy-salt"
    digest = hashlib.pbkdf2_hmac("sha256", b"StrongPassword123!", salt, 29000)
    legacy = f"$pbkdf2-sha256$29000${encode(salt)}${encode(digest)}"
    assert verify_password("StrongPassword123!", legacy)
    assert not verify_password("wrong", legacy)


@pytest.mark.asyncio
async def test_login_upgrades_legacy_hash(db_session, test_user):
    from src.api.services.auth import authenticate_password_user

    test_user.password_hash = bcrypt.hashpw(b"StrongPassword123!", bcrypt.gensalt()).decode()
    await db_session.commit()
    user = await authenticate_password_user(
        db_session, email=test_user.email, password="StrongPassword123!"
    )
    assert user is not None
    await db_session.refresh(user)
    assert user.password_hash.startswith("$argon2id$")
