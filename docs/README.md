# mutx.dev Developer Portal

Welcome to the mutx.dev platform documentation. This hub provides in-depth technical guides, architecture deep-dives, and operational instructions for contributors and platform builders.

## 🚀 Quick Start

- **[Deployment Quickstart](./deployment/quickstart.md)**: Get the full platform running.
- **[Architecture Overview](./architecture/overview.md)**: Understand the platform surfaces.

## 💻 Core Development

### Control Plane (API)
- **[API Overview](./api/index.md)**: Route topology and backend services.
- **[Authentication](./api/authentication.md)**: Auth flow and identity management.
- **[Agent Management](./api/agents.md)**: Agent lifecycle, deployment, and status.

### Operator Surface (Frontend)
The operator console is managed in `/app`. See `README.md` in the root for installation and development.

### Developer Tools
- **[CLI Guide](./cli.md)**: Terminal-first agent orchestration.
- **[SDK Reference](./api/index.md#python-sdk)**: Programmatic interface for developers.

## ☁️ Infrastructure & Ops

- **[Provisioning](./architecture/infrastructure.md)**: How we manage cloud resources.
- **[Containerization](./deployment/docker.md)**: Docker strategies for runtime surfaces.
- **[Railway Deployment](./deployment/railway.md)**: Managing production deployments.
- **[Security Posture](./architecture/security.md)**: Security-by-design and operational boundaries.

## ⚠️ Troubleshooting

- **[Common Issues](./troubleshooting/common-issues.md)**: Known pitfalls and fixes.
- **[Debugging Guide](./troubleshooting/debugging.md)**: Tools to trace platform behavior.
- **[Frequently Asked Questions](./troubleshooting/faq.md)**: Answers to common builder questions.

---

> **Note:** If documentation contradicts the codebase, the code is the ultimate source of truth. Refer to `src/api/routes/` for API payloads, `cli/` for CLI behavior, and `sdk/mutx/` for SDK logic.
