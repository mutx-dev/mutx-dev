from src.api.config import Settings


def test_cors_origins_accepts_comma_separated_string() -> None:
    settings = Settings.model_validate(
        {"cors_origins": "http://localhost:3000, https://app.mutx.dev"},
    )

    assert settings.cors_origins == [
        "http://localhost:3000",
        "https://app.mutx.dev",
    ]


def test_cors_origins_accepts_json_array_string() -> None:
    settings = Settings.model_validate(
        {"cors_origins": '["http://localhost:3000", "https://app.mutx.dev"]'},
    )

    assert settings.cors_origins == [
        "http://localhost:3000",
        "https://app.mutx.dev",
    ]
