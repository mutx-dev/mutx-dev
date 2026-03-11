from pathlib import Path

import json
from fastapi.openapi.utils import get_openapi

from src.api.main import app


def main() -> None:
    output_path = Path('docs/api/openapi.json')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w') as file_handle:
        json.dump(get_openapi(title=app.title, version=app.version, routes=app.routes), file_handle, indent=2)
    print(f'OpenAPI spec generated at {output_path}.')


if __name__ == '__main__':
    main()
