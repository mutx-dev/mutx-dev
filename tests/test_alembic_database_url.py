"""Migration bootstrap must preserve encoded database URL characters."""

import sqlalchemy as sa

from tests.test_migrations import _current_head, _run_alembic_upgrade


def test_alembic_upgrade_preserves_percent_in_database_path(tmp_path):
    database_path = tmp_path / "encoded%25.sqlite3"
    database_url = f"sqlite:///{database_path}"

    _run_alembic_upgrade(database_url)

    assert database_path.is_file()
    with sa.create_engine(database_url).connect() as connection:
        assert connection.execute(
            sa.text("SELECT version_num FROM alembic_version")
        ).scalar_one() == (_current_head())
        assert "agents" in sa.inspect(connection).get_table_names()
