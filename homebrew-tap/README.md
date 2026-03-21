# MUTX Homebrew Tap

Mirror of the published third-party tap repository `mutx-dev/homebrew-tap`.

## Install

Fastest macOS path to install MUTX with a guided setup flow:

```bash
curl -fsSL https://mutx.dev/install.sh | bash
```

That handoff now opens the MUTX provider wizard. 🦞 OpenClaw is the first enabled provider, and MUTX can detect an existing local install, track it in `~/.mutx/providers/openclaw`, and keep the upstream home plus local keys in place.

Manual tap flow:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
```

If Homebrew reports that `mutx` is already installed but not linked, overwrite the older shim in `/opt/homebrew/bin` with the Homebrew-managed one:

```bash
brew link --overwrite mutx
hash -r
which mutx
```

Use `brew link --overwrite mutx --dry-run` first if you want to inspect what will be replaced.

## Smoke check

```bash
mutx --help
mutx status
mutx runtime list
mutx tui
```

`mutx` reads the existing CLI config from `~/.mutx/config.json`, including `api_url`, `api_key`, and `refresh_token`.

If `mutx` throws `ModuleNotFoundError: No module named 'cli'`, your shell is still picking up a stale non-Brew wrapper instead of the linked Homebrew binary.

## Release process

1. Bump the CLI version in the monorepo `pyproject.toml`.
2. Push the monorepo release to `main`.
3. Create and push the matching `cli-vX.Y.Z` tag.
4. Update `Formula/mutx.rb` to the new tag tarball and checksum.
5. Commit and push the tap repo update.

The formula test must remain non-networked. Keep it on `mutx status` or `mutx --help`.
