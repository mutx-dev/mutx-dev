from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_makefile_auth_helper_uses_v1_url_prefix() -> None:
    makefile = read_text("Makefile")

    assert 'case "$$V1_URL" in */v1) ;; *) V1_URL="$$V1_URL/v1" ;; esac' in makefile
    assert "$$V1_URL/auth/register" in makefile
    assert "$$V1_URL/auth/login" in makefile
    assert "$$V1_URL/auth/me" in makefile


def test_backend_auth_docs_use_v1_routes() -> None:
    api_index = read_text("docs/api/index.md")
    api_auth = read_text("docs/api/authentication.md")
    contract_index = read_text("docs/contracts/api/index.md")
    contract_auth = read_text("docs/contracts/api/authentication.md")

    assert "/v1/auth/login" in api_index

    for content in (api_auth, contract_index, contract_auth):
        assert "/v1/auth/register" in content
        assert "/v1/auth/login" in content
        assert "/v1/auth/me" in content

    assert "There is no global `/v1` backend prefix." not in contract_index
    assert 'curl -X POST "$BASE_URL/v1/auth/register"' in contract_index
    assert 'curl "$BASE_URL/v1/auth/me"' in contract_auth


def test_dev_script_uses_project_scoped_compose_and_reuses_running_stack() -> None:
    dev_script = read_text("scripts/dev.sh")

    assert 'COMPOSE_PROJECT="${MUTX_COMPOSE_PROJECT:-mutx}"' in dev_script
    assert 'docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE"' in dev_script
    assert 'docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE"' in dev_script
    assert 'sed -i "s|^JWT_SECRET=.*$|JWT_SECRET=$JWT_SECRET|"' in dev_script
    assert 'sed -i \'\' "s|^JWT_SECRET=.*$|JWT_SECRET=$JWT_SECRET|"' in dev_script
    assert "Existing local stack detected for project" in dev_script
