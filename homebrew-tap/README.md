# MUTX Homebrew Tap

Mirror of the published third-party tap repository `mutx-dev/homebrew-tap`.
The live tap is published from CLI release tags (`cli-vX.Y.Z`) by the release workflow in the main repo.

## Install

Fastest macOS path to install MUTX with a guided setup flow:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx setup hosted
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
4. The release workflow regenerates `Formula/mutx.rb` from that tagged source, commits it to `mutx-dev/homebrew-tap`, and pushes the tap update.

The workflow requires a `HOMEBREW_TAP_TOKEN` repository secret with write access to `mutx-dev/homebrew-tap`.
`main` pushes alone do not update Homebrew. The formula test must remain non-networked.
