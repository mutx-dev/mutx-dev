# GEMINI.md - Project Context & Instructions

This document provides foundational context and mandates for Gemini CLI when working in the `mutx.dev` workspace.

## Project Overview

`mutx.dev` is a comprehensive platform for deploying and managing AI agents. It is a polyglot codebase featuring a Next.js frontend, a FastAPI backend, a Python CLI and SDK, and infrastructure managed via Terraform and Ansible.

- **Frontend (`app/`, `components/`):** Next.js 14 (App Router). Split into marketing (`app/(marketing)`) and a product dashboard (`app/app`), managed via host-based rewriting in `middleware.ts`.
- **Backend (`src/api/`):** FastAPI application handling authentication, agent lifecycle, and deployments.
- **CLI (`cli/`):** Click-based Python CLI for terminal-based platform interaction.
- **SDK (`sdk/`):** Python library for programmatic access to the `mutx.dev` platform.
- **Infrastructure (`infrastructure/`):** Terraform (DigitalOcean/AWS) and Ansible playbooks for provisioning and deployment.
- **Shared Logic (`lib/`):** Server-side helpers, including PostgreSQL persistence for the waitlist and database connections.

## Core Technologies

- **Frontend:** TypeScript, React, Next.js, Tailwind CSS, Framer Motion, Three.js, Radix UI.
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy (Async), PostgreSQL (pgvector), Redis, OpenAI, Anthropic, LangChain.
- **CLI/SDK:** Click, HTTPX.
- **Ops:** Docker, Docker Compose, Terraform, Ansible.

## Development Workflows

### Setup & Installation

```bash
# Frontend
npm install

# Backend & Tools
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev]"      # Installs root package (CLI) in dev mode
pip install -e "./sdk[dev]"   # Installs SDK in dev mode
```

### Running the Application

```bash
# Start Infrastructure (Postgres, Redis)
docker-compose up -d postgres redis

# Run Backend API
source .venv/bin/activate
uvicorn src.api.main:app --reload --port 8000

# Run Frontend
npm run dev
```

### Testing & Validation

```bash
# Frontend Lint & Build
npm run lint
npm run build

# Playwright E2E (Note: currently targets production URL by default)
npx playwright test

# Python Linting & Formatting (Line length: 100)
ruff check src/api cli sdk
black src/api cli sdk

# Python Tests
python3 -m pytest
```

## Engineering Mandates & Conventions

### General
- **Code vs. Docs:** Prioritize source code and configuration files over prose documentation if they conflict.
- **Targeted Changes:** Make surgical, minimal changes. Avoid repo-wide reformatting unless explicitly requested.
- **Environment Variables:** Centralize environment variable usage. Use `.env.example` as a reference.

### Python (Backend, CLI, SDK)
- **Style:** 4-space indentation, 100-character line limit. Use Ruff for linting and Black for formatting.
- **Typing:** Use type hints for all public functions and service methods.
- **Pydantic:** Prefer Pydantic v2 conventions (`model_config = ConfigDict(...)`).
- **Backend Architecture:** Keep route handlers thin. Place business logic in `src/api/services/`.
- **Database:** Use SQLAlchemy async patterns (`AsyncSession`). Note that `src/api/database.py` auto-creates tables on startup.

### TypeScript / Next.js
- **Style:** Strict TypeScript mode. Use PascalCase for components and types, camelCase for variables and functions.
- **Pathing:** Use `@/` path aliases for internal imports.
- **Components:** Add `'use client'` only when strictly necessary.
- **Styling:** Use inline Tailwind CSS classes. Adhere to the existing "dark mode" aesthetic (Space Grotesk typography, subtle gradients).

## Known Constraints & Gaps
- **API Versioning:** The API currently does *not* use a `/v1` prefix.
- **Documentation Drift:** Some parts of `README.md` and `docs/` may overstate the current feature set. Align changes with actual code behavior.
- **Playwright Tests:** Existing tests in `tests/` hit `https://mutx.dev` directly. Exercise caution when running them in a local development context.
- **CLI Package:** `cli/` is part of the root Python package, not a standalone package. Use `pip install -e .` from the root to install it.

## Key File Locations
- `app/`: Next.js App Router (Frontend).
- `src/api/`: FastAPI Backend.
- `cli/`: CLI source.
- `sdk/`: SDK source.
- `lib/`: Shared database and persistence logic.
- `infrastructure/`: Terraform and Ansible.
- `AGENTS.md`: Detailed agent-specific coding guidance.
- `ROADMAP.md`: Current project priorities and future plans.
