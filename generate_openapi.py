import json
from fastapi.openapi.utils import get_openapi
from src.api.main import app
from pathlib import Path

Path('docs/api').mkdir(parents=True, exist_ok=True)
with open('docs/api/openapi.json', 'w') as f:
    json.dump(get_openapi(title=app.title, version=app.version, routes=app.routes), f, indent=2)
print("OpenAPI spec generated.")
