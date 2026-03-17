---
description: CLI release process, versioning, and tagging conventions.
icon: book
---

# CLI Release Process

This document defines the release process, versioning scheme, and tag conventions for the MUTX CLI.

## Versioning Scheme

MUTX follows **Semantic Versioning (SemVer)**:

- **MAJOR** (x.0.0): Breaking changes to CLI interface or API
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

Current version: `0.1.0` (Alpha)

## Tag Convention

All releases use the format `cli/v<version>`:

```bash
# Example
git tag cli/v0.1.0
git tag cli/v0.2.0
git tag cli/v1.0.0
```

### Pre-release Tags

For alpha/beta releases:

```bash
git tag cli/v0.2.0-alpha.1
git tag cli/v0.2.0-beta.1
```

## Release Checklist

1. **Bump version** in `pyproject.toml`:
   ```toml
   version = "0.2.0"
   ```

2. **Update changelog** in `docs/changelog-status.md`

3. **Create git tag**:
   ```bash
   git tag cli/v0.2.0
   git push origin cli/v0.2.0
   ```

4. **Publish to PyPI** (if applicable):
   ```bash
   python -m build
   twine upload dist/*
   ```

5. **Create GitHub release**:
   - Navigate to https://github.com/mutx-dev/mutx-dev/releases
   - Click "Draft a new release"
   - Select the tag `cli/v<version>`
   - Add release notes

## CLI Structure

```
cli/
├── main.py          # CLI entry point, auth commands
├── config.py        # Configuration management
└── commands/
    ├── agents.py    # Agent CRUD operations
    ├── deploy.py   # Deployment management
    ├── api_keys.py # API key management
    ├── clawhub.py  # Skill management
    ├── config.py   # Config viewing/editing
    └── webhooks.py # Webhook management
```

## Installation

### From Source

```bash
git clone https://github.com/mutx-dev/mutx-dev
cd mutx-dev
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### From PyPI (when published)

```bash
pip install mutx
```

## Building Distribution

```bash
# Install build tools
pip install build twine

# Build
python -m build

# Verify
twine check dist/*
```

## GitHub Actions (Future)

Automate releases with GitHub Actions:

```yaml
# .github/workflows/release.yml
name: Release CLI

on:
  push:
    tags:
      - 'cli/v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install build twine
      - run: python -m build
      - run: twine upload dist/*
        env:
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
```
