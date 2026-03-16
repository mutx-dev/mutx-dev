# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and documentation

### Changed
- Updated from time to time with new features and fixes

## [1.0.0] - 2024-01-01

### Added
- Frontend application with Next.js 15
- API surface with FastAPI backend
- CLI tool for agent deployment and management
- SDK for programmatic access
- Desktop application (Electron)
- Mobile applications (iOS/Android with Capacitor)
- Docker and infrastructure deployment configs

### API Routes
- `/auth` - Authentication endpoints
- `/agents` - Agent management
- `/deployments` - Deployment management
- `/ingest/*` - Data ingestion endpoints
- `/webhooks/*` - Webhook destination management

### Fixed
- Initial stable release

## [0.1.0] - 2023-06-01

### Added
- Initial CLI alpha release
- Basic agent deployment capabilities
- Python SDK with core functionality

---

## Release Types

We use the following release types in our changelog:

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security-related changes

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Given a version number `MAJOR.MINOR.PATCH`:

- **MAJOR** (X.0.0): Incompatible API changes, major refactoring
- **MINOR** (1.X.0): New backwards-compatible functionality
- **PATCH** (1.0.X): Backwards-compatible bug fixes

### Component Versions

| Component | Current Version | Location |
|-----------|-----------------|----------|
| Frontend/App | 1.0.0 | `package.json` |
| CLI/SDK (Python) | 0.1.0 | `pyproject.toml` |
| API | Matches frontend | `package.json` |

## How We Release

1. **Development**: Features are developed in feature branches
2. **Pull Request**: Changes are submitted via PR and reviewed
3. **Merge**: Merged changes land in `main`
4. **Version Bump**: Maintainers update version numbers in relevant files
5. **Release**: A GitHub Release is created with changelog notes
6. **Deployment**: CI/CD pipelines deploy to staging/production

See [docs/changelog-status.md](./docs/changelog-status.md) for status sources and live endpoints.
