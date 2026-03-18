"""
Pytest configuration and fixtures for MUTX API tests.
"""

import os

from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.compiler import compiles

# Set environment before any imports
os.environ.setdefault("DATABASE_REQUIRED_ON_STARTUP", "false")
os.environ.setdefault("JWT_SECRET", "test-secret-key-that-is-long-enough-32+")

# Use an isolated SQLite database for tests by default.
# Do not inherit DATABASE_URL from the shell, or tests can accidentally hit a
# real/dev database and fail in misleading ways.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Configure pytest-asyncio
pytest_plugins = ("pytest_asyncio",)


@compiles(PGUUID, "sqlite")
def compile_uuid_sqlite(_type, _compiler, **_kw):
    return "CHAR(36)"
