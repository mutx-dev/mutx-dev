from pathlib import Path
import sys

import json
from fastapi.openapi.utils import get_openapi

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.api.main import app  # noqa: E402


def main() -> None:
    output_path = Path("docs/api/openapi.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w") as file_handle:
        json.dump(
            get_openapi(title=app.title, version=app.version, routes=app.routes),
            file_handle,
            indent=2,
        )
    print(f"OpenAPI spec generated at {output_path}.")


if __name__ == "__main__":
    main()
