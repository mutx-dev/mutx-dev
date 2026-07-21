# Repo Size Audit

Date: 2026-06-02
Branch: `codex/repo-size-audit`

> 2026-07-21 follow-up: the Operational Ledger redesign removed the unused
> `public/marketing` media tree and four retired auth illustrations after a
> repository-wide literal reference audit.
> The sizes below remain the historical baseline that motivated that cleanup.

## Measurement Commands

```bash
git status --short
git count-objects -vH
du -sh .
du -sh * | sort -h
find . -type f | wc -l
cloc . --exclude-dir=.git,node_modules,.venv,dist,build,.next,coverage,__pycache__
tokei . --exclude .git --exclude node_modules --exclude .venv --exclude dist --exclude build --exclude .next
```

`cloc` and `tokei` were not installed on PATH. `npx --yes cloc ...` was used as a fallback for LOC. `tokei` had no usable `npx` executable, so no `tokei` baseline is available from this machine.

## Baseline

| Metric | Value | Notes |
| --- | ---: | --- |
| Working tree size | 5.3G | Includes `.git`, `.next`, `.venv`, `node_modules`, local reports, worktrees, and untracked screenshots. |
| Raw file count | 127,598 | `find . -type f`; includes dependencies, venv, build output, and caches. |
| Tracked file count | 1,614 | `git ls-files \| wc -l`. |
| Counted source files | 2,184 | `npx cloc` fallback, excluding `.git`, `node_modules`, `.venv`, `dist`, `build`, `.next`, `coverage`, `__pycache__`. |
| Counted source LOC | 512,405 | `npx cloc` fallback. Six large files exceeded cloc timeout but were still listed as errors. |
| Raw non-build file count | 6,892 | Excludes common build/dependency/cache directories. |
| Raw `wc -l` sanity check | 3,013,993 | Inflated by binary/generated assets; not the canonical LOC number. |
| Git loose objects | 2,235 / 55.83 MiB | `git count-objects -vH`. |
| Git packed objects | 51,511 / 273.52 MiB | `git count-objects -vH`. |
| Git garbage | 25 / 19.17 MiB | Temporary objects in `.git/objects`; do not remove inside a product PR. |

`git status --short` showed pre-existing untracked local artifacts: `.playwright-mcp/`, many root-level `pico-*.png` screenshots, and `tests/unit/middlewareRouting.test.ts.backup`. They are not part of this audit PR.

## LOC By Language

Primary `cloc` fallback totals:

| Language | Files | Code LOC |
| --- | ---: | ---: |
| Python | 1,025 | 218,808 |
| JSON | 49 | 114,454 |
| TypeScript | 536 | 111,328 |
| YAML | 127 | 19,249 |
| Markdown | 216 | 18,603 |
| CSS | 17 | 14,283 |
| JavaScript | 39 | 6,300 |
| Bourne Shell | 55 | 4,167 |
| HCL | 13 | 1,224 |
| Other | 305 | 4,889 |
| **Total** | **2,184** | **512,405** |

`cloc` timeout warnings were reported for:

- `.tmp/record-dashboard-demos.mjs` (`CACHE_BUILD`)
- `.worktrees/hermes-d3cfbc3d/components/app/AppDashboardClient.tsx` (`CACHE_BUILD`)
- `components/app/AppDashboardClient.tsx` (`KEEP_CORE`, but too large and worth a focused refactor issue)
- `scripts/dashboard-interactions-smoke.mjs` (`KEEP_CORE`)
- `scripts/desktop-cockpit-smoke.mjs` (`KEEP_CORE`)
- `tests/dashboardRouteMatrix.spec.ts` (`KEEP_CORE`)

## Top 25 Largest Directories

| Size | Path | Label |
| ---: | --- | --- |
| 2.1G | `.next` | `CACHE_BUILD` |
| 1.2G | `node_modules` | `VENDOR_DEP` |
| 1.2G | `.venv` | `CACHE_BUILD` |
| 1.1G | `.next/dev` | `CACHE_BUILD` |
| 1.1G | `.venv/lib` | `CACHE_BUILD` |
| 921M | `.next/cache` | `CACHE_BUILD` |
| 372M | `.git` | `RISKY` |
| 273M | `node_modules/electron` | `VENDOR_DEP` |
| 207M | `node_modules/app-builder-bin` | `VENDOR_DEP` |
| 170M | `node_modules/next` | `VENDOR_DEP` |
| 147M | `.worktrees` | `CACHE_BUILD` |
| 127M | `.worktrees/hermes-d3cfbc3d` | `CACHE_BUILD` |
| 118M | `.venv/bin` | `CACHE_BUILD` |
| 117M | `node_modules/@next` | `VENDOR_DEP` |
| 66M | `.next/standalone` | `CACHE_BUILD` |
| 62M | `public` | `KEEP_CORE` / media audit needed |
| 36M | `.tmp` | `CACHE_BUILD` |
| 31M | `node_modules/electron-winstaller` | `VENDOR_DEP` |
| 30M | `public/marketing` | `KEEP_CORE` / media audit needed |
| 28M | `node_modules/lucide-react` | `VENDOR_DEP` |
| 23M | `node_modules/typescript` | `VENDOR_DEP` |
| 23M | `node_modules/@swc` | `VENDOR_DEP` |
| 23M | `infrastructure/terraform` | `RISKY` |
| 23M | `infrastructure` | `RISKY` |
| 21M | `tests` | `KEEP_CORE` |

## Top 50 Largest Tracked Files

| Size | Path | Label |
| ---: | --- | --- |
| 8.6M | `public/marketing/dashboard/story-demo.mp4` | `KEEP_CORE` / media audit needed |
| 2.3M | `public/landing/wiring-bay.png` | `KEEP_CORE` / media audit needed |
| 2.2M | `docs/assets/architecture overview.png` | `KEEP_CORE` / docs asset |
| 2.1M | `public/marketing/loader/mutx-logo-loader-60fps-2x.webm` | `KEEP_CORE` / media audit needed |
| 2.1M | `public/landing/victory-core.png` | `KEEP_CORE` / media audit needed |
| 2.1M | `public/landing/thumbs-up-portrait.png` | `KEEP_CORE` / media audit needed |
| 2.0M | `public/pico/logo.png` | `KEEP_CORE` / media audit needed |
| 2.0M | `public/marketing/call-me.png` | `KEEP_CORE` / media audit needed |
| 2.0M | `public/landing/reading-bench.png` | `KEEP_CORE` / media audit needed |
| 1.9M | `public/marketing/cards/enterprise.mp4` | `KEEP_CORE` / media audit needed |
| 1.9M | `public/landing/docs-surface.png` | `KEEP_CORE` / media audit needed |
| 1.9M | `output/playwright/pico-desktop-full.png` | `CACHE_BUILD` |
| 1.8M | `public/pico/robot/hero-wave.png` | `KEEP_CORE` / media audit needed |
| 1.7M | `public/landing/hero-manifesto.png` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/runtime.mp4` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/pathway.mp4` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/managed-layers.mp4` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/governance.mp4` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/ecosystem.mp4` | `KEEP_CORE` / media audit needed |
| 1.6M | `public/marketing/carousel/cost-awareness.mp4` | `KEEP_CORE` / media audit needed |
| 1.5M | `public/logo.png` | `KEEP_CORE` / possible duplicate media |
| 1.5M | `public/logo-transparent-v2.png` | `KEEP_CORE` / possible duplicate media |
| 1.5M | `public/logo-new.png` | `KEEP_CORE` / possible duplicate media |
| 1.3M | `public/demo.gif` | `PREVIEW` / verify marketing references |
| 1.2M | `output/playwright/pico-mobile-full.png` | `CACHE_BUILD` |
| 1.0M | `public/marketing/loader/mutx-logo-loader-60fps-2x.mp4` | `KEEP_CORE` / possible duplicate media |
| 1.0M | `public/marketing/cards/developer.mp4` | `KEEP_CORE` / media audit needed |
| 936K | `public/landing/running-agent.png` | `KEEP_CORE` / media audit needed |
| 684K | `docs/api/openapi.json` | `GENERATED` / required contract artifact |
| 652K | `package-lock.json` | `KEEP_CORE` |
| 644K | `public/marketing/icons/universal-rotating.mp4` | `KEEP_CORE` / media audit needed |
| 540K | `public/marketing/dashboard/traces-demo.mp4` | `KEEP_CORE` / media audit needed |
| 532K | `public/pico/robot/point.png` | `KEEP_CORE` / media audit needed |
| 528K | `public/pico/robot/coins.png` | `KEEP_CORE` / media audit needed |
| 524K | `public/pico/robot/guide.png` | `KEEP_CORE` / media audit needed |
| 524K | `public/marketing/dashboard/overview-demo.mp4` | `KEEP_CORE` / media audit needed |
| 516K | `public/pico/robot/coffee.png` | `KEEP_CORE` / media audit needed |
| 516K | `public/pico/robot/celebrate.png` | `KEEP_CORE` / media audit needed |
| 512K | `public/pico/robot/relax.png` | `KEEP_CORE` / media audit needed |
| 480K | `app/types/api.ts` | `GENERATED` / required contract artifact |
| 464K | `public/pico/robot/sprint.png` | `KEEP_CORE` / media audit needed |
| 452K | `public/pico/robot/orbit.png` | `KEEP_CORE` / media audit needed |
| 448K | `public/pico/robot/builder.png` | `KEEP_CORE` / media audit needed |
| 440K | `public/pico/robot/thumbs-up.png` | `KEEP_CORE` / media audit needed |
| 440K | `public/pico/robot/sprout.png` | `KEEP_CORE` / media audit needed |
| 432K | `public/pico/robot/wave.png` | `KEEP_CORE` / media audit needed |
| 400K | `public/marketing/dashboard/webhooks-demo.mp4` | `KEEP_CORE` / media audit needed |
| 376K | `output/playwright/.playwright-cli/page-2026-04-16T20-15-40-847Z.png` | `CACHE_BUILD` |
| 360K | `public/pico/logo.webp` | `KEEP_CORE` / possible duplicate media |
| 340K | `public/pico/android-chrome-512x512.png` | `KEEP_CORE` |

## Classification Findings

### `KEEP_CORE`

- `src/api`, `src/security`, `src/runtime`, `cli`, `sdk/mutx`, `app/api`, `app/dashboard`, `components/dashboard`, `components/app`, `tests`, and required docs are product spine.
- `docs/api/openapi.json` and `app/types/api.ts` are generated but committed by repo policy and checked by `scripts/verify-generated-artifacts.sh`.
- `scripts/dashboard-interactions-smoke.mjs`, `scripts/desktop-cockpit-smoke.mjs`, and route matrix tests are large but part of the evidence loop.

### `GENERATED`

- `docs/api/openapi.json`
- `app/types/api.ts`
- `next-env.d.ts`
- `public/docs-search-index.json` when present
- `lib/pico/generatedContent.ts`
- `mutx_cli.egg-info`
- `tsconfig.tsbuildinfo`

Keep generated contract artifacts until repo policy changes. Mark generated artifacts in `.gitattributes` in a dedicated PR rather than deleting them.

### `CACHE_BUILD`

- `.next`, `.venv`, `.worktrees`, `.tmp`, `tmp`, `coverage`, `playwright-report`, `test-results`, `reports`, `output/playwright`, `__pycache__`, `.pytest_cache`.
- Several of these are already ignored but have tracked or local files. `output/playwright/*` is the highest-confidence tracked deletion candidate.

### `VENDOR_DEP`

- `node_modules`, `.venv`, and Terraform provider caches are local dependency/cache directories and should stay untracked.
- No tracked `node_modules` or `.venv` files were found in `git ls-files`.

### `DUPLICATE`

- Browser-facing route handlers overlap across top-level `app/api/agents`, `app/api/deployments`, and `app/api/dashboard/*` proxy routes. Treat as contract-sensitive until route inventory and tests prove consolidation.
- `public/logo.png`, `public/logo-new.png`, `public/logo-transparent-v2.png`, `public/pico/logo.png`, and `public/pico/logo.webp` may contain overlapping brand assets. Do not delete until references are checked.
- Dashboard route wrappers repeatedly render `DesktopRouteBoundary`; likely refactorable, but not a deletion candidate without tests.

### `PREVIEW`

- `app/control/[[...slug]]/page.tsx` and `components/dashboard/demo/*` are explicitly documented as browser demo/control preview surfaces.
- Dashboard routes marked `preview` in `components/desktop/desktopRouteConfig.ts` include preview-backed or redirect-backed areas that must remain out of stable primary navigation until their contracts mature.
- `public/demo.gif` is embedded in the README and should not be deleted without replacing that project preview.

### `DEAD`

- No source file is classified as `DEAD` in this audit. A dead-code PR must prove absence with import/reference search, route inventory, package scripts, and tests.
- Tracked `output/playwright/*` files are classified as reproducible output, not source dead code.

### `RISKY`

Do not delete without a dedicated issue, tests, and narrow PR:

- Auth, RBAC, OIDC: `src/api/security.py`, `src/api/auth/*`, `app/api/auth/*`, middleware, and auth tests.
- Audit/evidence/policy/approvals: runs, traces, observability, security mediator/context, approval models, audit logs, ingestion, and related tests.
- Migrations: `src/api/models/migrations/versions/*`.
- Billing/Stripe and checkout routes.
- SDK public APIs and CLI commands.
- Helm, Terraform, Ansible, and deployment assets under `infrastructure`.
- Generated contracts required by repo policy: `docs/api/openapi.json`, `app/types/api.ts`.

## Safe Deletion Candidates

Highest confidence for the next PR:

- `output/playwright/**` (`CACHE_BUILD`): tracked Playwright CLI screenshots/YAML output. `.gitignore` already ignores `tmp/`, `reports/`, `test-results/`, and `playwright-report/`, but not `output/`; add an ignore rule and remove tracked output files.
- Root-level untracked `pico-*.png` screenshots (`CACHE_BUILD`): local-only; do not include in PR unless explicitly cleaning the developer workspace.
- `tests/unit/middlewareRouting.test.ts.backup` (`CACHE_BUILD`): untracked backup copy; local-only.

Needs proof before deletion:

- `public/demo.gif` (`PREVIEW`): embedded in `README.md` and guarded by the docs-drift suite.
- Duplicate logo variants under `public/` and `public/pico/`.
- Preview/control route code under `app/control` and `components/dashboard/demo`.
- Large marketing media under `public/marketing` and `public/landing`.

## Recommended PR Sequence

1. `docs: add repo size audit`
   - Add this audit only.
   - No source, generated contract, or behavior changes.
2. `chore: remove committed cache and build artifacts`
   - Remove tracked `output/playwright/**`.
   - Add `/output/` or narrower `/output/playwright/` to `.gitignore`.
   - Report tracked file/LOC deltas before and after.
3. `chore: mark generated files for linguist`
   - Add `.gitattributes`.
   - Mark `docs/api/openapi.json`, `app/types/api.ts`, `lib/pico/generatedContent.ts`, `next-env.d.ts`, and any generated docs search artifact as generated.
4. `chore: tighten gitignore for generated outputs`
   - Ensure Playwright MCP/output, screenshots, local worktree caches, `*.tsbuildinfo`, and build reports are consistently ignored.
   - Keep repo-required generated contracts tracked.
5. `refactor: remove stale preview surface X`
   - Pick exactly one preview surface after confirming it is not linked from stable navigation.
   - Candidate: a single preview-backed dashboard wrapper or `/control` demo subsection, not the whole control shell.
6. `refactor: consolidate duplicate service Y`
   - Pick one duplicate proxy/service area only.
   - Candidate: repeated dashboard route wrappers or one pair of overlapping deployment/agent proxy helpers.
7. `test: protect evidence-loop behavior around Z`
   - Add focused tests before risky cleanup.
   - Candidate: runs/traces/policies/approvals/audit ingestion contract.

## Validation Expectations For Follow-Up PRs

- Python touched: `ruff check <paths>`, `black --check <paths>`, `python -m compileall <paths>`.
- Frontend/types touched: `npm run typecheck`.
- Frontend behavior touched: `npm run build`.
- API touched: `python scripts/generate_openapi.py`, `npm run generate-types`, and generated artifact diff review.
- Deletion PRs: show reference/import checks, route inventory when relevant, deleted files, before/after tracked file count, before/after LOC, validation, rollback risk, and follow-up cuts.
