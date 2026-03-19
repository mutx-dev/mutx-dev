import base64
import hashlib
import secrets
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from src.api.config import get_settings


def hash_token_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def verify_token_value(value: str, expected_hash: str) -> bool:
    return secrets.compare_digest(hash_token_value(value), expected_hash)


def _derive_fernet_key(secret_material: str) -> bytes:
    digest = hashlib.sha256(secret_material.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


@lru_cache()
def _get_fernet() -> Fernet:
    settings = get_settings()
    key_material = settings.secret_encryption_key or settings.jwt_secret
    return Fernet(_derive_fernet_key(key_material))


def encrypt_secret_value(value: str | None) -> str | None:
    if not value:
        return None

    encrypted = _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")
    return f"enc:{encrypted}"


def decrypt_secret_value(value: str | None) -> str | None:
    if not value:
        return None

    if not value.startswith("enc:"):
        return value

    token = value[4:]
    try:
        return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None
