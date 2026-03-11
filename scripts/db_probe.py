import asyncio
import os
from urllib.parse import urlparse

import asyncpg
import psycopg


def normalize(database_url: str, host: str | None = None, sslmode: str | None = None) -> str:
    parsed = urlparse(database_url)
    hostname = host or parsed.hostname or ""
    username = parsed.username or ""
    password = parsed.password or ""
    database = parsed.path.lstrip("/")
    port = parsed.port or 5432
    auth = username
    if password:
        auth += f":{password}"
    query = ""
    if sslmode:
        query = f"?sslmode={sslmode}"
    return f"postgresql://{auth}@{hostname}:{port}/{database}{query}"


async def probe_asyncpg(name: str, database_url: str, ssl):
    try:
        conn = await asyncpg.connect(database_url, ssl=ssl, timeout=5, statement_cache_size=0)
        row = await conn.fetchrow("select 1 as ok")
        await conn.close()
        print(f"asyncpg {name}: ok -> {dict(row)}")
    except Exception as exc:  # noqa: BLE001
        print(f"asyncpg {name}: {type(exc).__name__}: {exc}")


def probe_psycopg(name: str, database_url: str):
    try:
        with psycopg.connect(database_url, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("select 1 as ok")
                print(f"psycopg {name}: ok -> {cur.fetchone()}")
    except Exception as exc:  # noqa: BLE001
        print(f"psycopg {name}: {type(exc).__name__}: {exc}")


async def main():
    database_url = os.environ["DATABASE_URL"]
    public_host = os.getenv("RAILWAY_SERVICE_POSTGRES_URL")

    print(f"DATABASE_URL host={urlparse(database_url).hostname}")
    print(f"RAILWAY_SERVICE_POSTGRES_URL={public_host}")

    await probe_asyncpg("internal-disable", database_url, False)
    await probe_asyncpg("internal-require", database_url, "require")

    if public_host:
        public_disable = normalize(database_url, host=public_host, sslmode="disable")
        public_require = normalize(database_url, host=public_host, sslmode="require")
        await probe_asyncpg("public-disable", public_disable, False)
        await probe_asyncpg("public-require", public_require, "require")
        probe_psycopg("public-disable", public_disable)
        probe_psycopg("public-require", public_require)

    probe_psycopg("internal-disable", normalize(database_url, sslmode="disable"))
    probe_psycopg("internal-require", normalize(database_url, sslmode="require"))


if __name__ == "__main__":
    asyncio.run(main())
