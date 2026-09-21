import base64
import hashlib
import hmac
import re
from typing import Optional

import bcrypt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

_password_hasher = PasswordHasher()

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def password_needs_rehash(hashed_password: str) -> bool:
    if not hashed_password.startswith("$argon2id$"):
        return True
    try:
        return _password_hasher.check_needs_rehash(hashed_password)
    except (InvalidHashError, ValueError):
        return True


def _verify_legacy_pbkdf2(password: str, encoded: str) -> bool:
    """Verify Passlib's historical adapted-base64 format without the retired package."""
    try:
        _, scheme, rounds, salt, expected = encoded.split("$")
        iterations = int(rounds)
        if scheme != "pbkdf2-sha256" or not 1 <= iterations <= 10_000_000:
            return False

        def decode(value: str) -> bytes:
            return base64.b64decode(
                value.replace(".", "+") + "=" * (-len(value) % 4), validate=True
            )

        expected_digest = decode(expected)
        if len(expected_digest) != 32:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), decode(salt), iterations)
        return hmac.compare_digest(actual, expected_digest)
    except (ValueError, TypeError, UnicodeError):
        return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("$pbkdf2-sha256$"):
        return _verify_legacy_pbkdf2(plain_password, hashed_password)
    if hashed_password.startswith("$argon2"):
        try:
            return _password_hasher.verify(hashed_password, plain_password)
        except (VerificationError, InvalidHashError, ValueError, TypeError):
            return False
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except (ValueError, TypeError):
        return False


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"

    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return False, f"Password must not exceed {MAX_PASSWORD_BYTES} bytes"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"

    return True, None
