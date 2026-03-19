# MUTX Homebrew Tap

This directory is the scaffold for the third-party tap repository `mutx-dev/homebrew-tap`.

## What to update on each CLI release

1. Copy this directory into the tap repository root.
2. Update `Formula/mutx.rb`:
   - `url` from the current commit archive to the matching `cli-vX.Y.Z` source archive
   - `sha256` to the tagged archive checksum
   - `version` to the CLI distribution version from the root `pyproject.toml`
3. Commit and push the tap change.

## Validation

The formula test must stay non-networked:

```bash
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx status
```

The runtime dependency resources in the formula were generated from a successful local `pip install -e ".[dev,tui]"` resolution against the current repo state.
