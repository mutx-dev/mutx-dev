import json
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def normalize_openapi_document(value: Any) -> Any:
    if isinstance(value, list):
        return [normalize_openapi_document(item) for item in value]

    if not isinstance(value, dict):
        return value

    normalized = {key: normalize_openapi_document(item) for key, item in value.items()}
    all_of = normalized.get("allOf")
    if (
        isinstance(all_of, list)
        and len(all_of) == 1
        and isinstance(all_of[0], dict)
        and set(all_of[0]) == {"$ref"}
    ):
        merged = {"$ref": all_of[0]["$ref"]}
        merged.update((key, item) for key, item in normalized.items() if key != "allOf")
        return merged

    if (
        normalized.get("type") == "object"
        and normalized.get("additionalProperties") is True
    ):
        normalized = {
            key: item for key, item in normalized.items() if key != "additionalProperties"
        }

    return normalized


def build_openapi_document() -> dict[str, Any]:
    from fastapi.openapi.utils import get_openapi

    from src.api.main import app  # noqa: E402

    return normalize_openapi_document(
        get_openapi(title=app.title, version=app.version, routes=app.routes)
    )


def main() -> None:
    output_path = Path("docs/api/openapi.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w") as file_handle:
        json.dump(build_openapi_document(), file_handle, indent=2)
    print(f"OpenAPI spec generated at {output_path}.")


if __name__ == "__main__":
    main()
