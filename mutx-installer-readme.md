# MUTX Installer Skill

Install and configure MUTX on any Linux or macOS system.

## What This Skill Does

1. Detects the target OS and available runtimes (Docker or Node.js 20+)
2. Clones or updates the MUTX repository
3. Generates a secure `.env` with random credentials
4. Starts MUTX via Docker Compose or local Node.js
5. Runs a fleet health check (cleans stale PIDs, old logs, validates gateway)
6. Prints the access URL and admin credentials

## Usage

Run the installer script:

    bash install.sh

Or as a one-liner:

    curl -fsSL https://raw.githubusercontent.com/mutx-dev/mutx/main/install.sh | bash

## Prerequisites

- Docker mode: Docker Engine with Docker Compose v2
- Local mode: Node.js 20+, pnpm (auto-installed via corepack if missing)
- Both: git (to clone the repository)

## Post-Install

After installation:

1. Open http://localhost:3000 (or your configured port)
2. Log in with the credentials printed by the installer (also in .env)
3. Configure your gateway connection in Settings
4. Register agents via the Agents panel
