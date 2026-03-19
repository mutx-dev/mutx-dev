# MUTX Homebrew Tap

Mirror of the published third-party tap repository `mutx-dev/homebrew-tap`.

## Install

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
```

## Smoke check

```bash
mutx --help
mutx status
mutx tui
```

`mutx` reads the existing CLI config from `~/.mutx/config.json`, including `api_url`, `api_key`, and `refresh_token`.

## Release process

1. Bump the CLI version in the monorepo `pyproject.toml`.
2. Push the monorepo release to `main`.
3. Create and push the matching `cli-vX.Y.Z` tag.
4. Update `Formula/mutx.rb` to the new tag tarball and checksum.
5. Commit and push the tap repo update.

The formula test must remain non-networked. Keep it on `mutx status` or `mutx --help`.
