from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_generate_openapi_module():
    module_path = Path(__file__).resolve().parents[1] / "scripts" / "generate_openapi.py"
    spec = importlib.util.spec_from_file_location("generate_openapi", module_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_normalize_openapi_document_flattens_single_ref_allof() -> None:
    module = _load_generate_openapi_module()

    document = {
        "components": {
            "schemas": {
                "AgentConfig": {
                    "properties": {
                        "type": {
                            "allOf": [{"$ref": "#/components/schemas/AgentType"}],
                            "default": "openai",
                        }
                    }
                }
            }
        }
    }

    assert module.normalize_openapi_document(document) == {
        "components": {
            "schemas": {
                "AgentConfig": {
                    "properties": {
                        "type": {
                            "$ref": "#/components/schemas/AgentType",
                            "default": "openai",
                        }
                    }
                }
            }
        }
    }


def test_normalize_openapi_document_keeps_multi_entry_allof() -> None:
    module = _load_generate_openapi_module()

    document = {
        "properties": {
            "value": {
                "allOf": [
                    {"$ref": "#/components/schemas/BaseValue"},
                    {"type": "string"},
                ]
            }
        }
    }

    assert module.normalize_openapi_document(document) == document
