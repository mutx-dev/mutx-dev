# CONTENT_MAP

Canonical source: `lib/pico/academy.ts`

## Level inventory
- Level 0 - Setup - status: shipped
- Level 1 - Deployment - status: shipped
- Level 2 - Capability - status: shipped
- Level 3 - Automation - status: shipped
- Level 4 - Production - status: shipped
- Level 5 - Control - status: shipped
- Level 6 - Systems - status: shipped

## Track inventory
- Track A - First Agent (`first-agent`) - status: shipped
- Track B - Deployed Agent (`deployed-agent`) - status: shipped
- Track C - Useful Workflow (`useful-workflow`) - status: shipped
- Track D - Controlled Agent (`controlled-agent`) - status: shipped
- Track E - Production Pattern (`production-pattern`) - status: shipped

## Lesson inventory

| Slug | Lesson | Level | Track | Status | Artifact |
|------|--------|-------|-------|--------|----------|
| install-hermes-locally | Install Hermes locally | 0 | first-agent | shipped | Working local Hermes runtime |
| run-your-first-agent | Run your first agent | 0 | first-agent | shipped | Saved first prompt and response |
| deploy-hermes-on-a-vps | Deploy Hermes on a VPS | 1 | deployed-agent | shipped | Persistent Hermes runtime |
| keep-your-agent-alive | Keep your agent alive between sessions | 1 | deployed-agent | shipped | Service or process-manager definition |
| connect-a-messaging-layer | Connect a messaging layer | 1 | deployed-agent | shipped | Working message ingress |
| add-your-first-skill | Add your first skill/tool | 2 | useful-workflow | shipped | First documented skill or tool capability |
| create-a-scheduled-workflow | Create a scheduled workflow | 3 | useful-workflow | shipped | Scheduled workflow |
| see-your-agent-activity | See your agent activity | 4 | controlled-agent | shipped | Readable run timeline |
| set-a-cost-threshold | Set a cost threshold | 5 | controlled-agent | shipped | Budget threshold plus warning path |
| add-an-approval-gate | Add an approval gate | 5 | controlled-agent | shipped | Approval gate plus decision trail |
| build-a-lead-response-agent | Build a lead-response agent | 6 | production-pattern | shipped | Reusable lead-response pattern |
| build-a-document-processing-agent | Build a document-processing agent | 6 | production-pattern | shipped | Reusable document-processing pattern |

## Content schema
Every lesson in the canonical corpus includes:
- slug
- title
- summary
- objective
- prerequisites
- outcome
- expected result
- validation
- troubleshooting
- ordered steps
- duration
- XP reward
- next lesson hint
- milestone event bindings when applicable

## Current content gaps
- Localized Pico lesson copy outside English still needs a cleanup sweep.
- Visual assets and diagrams for harder deployment lessons are still thin.
- The document-processing lesson still needs richer sample files.
- Video walkthroughs do not exist and are not required for v1 ship.

## Content audit decisions
- Kept all 12 lessons, but rewrote the weak ones instead of letting them ship as filler.
- Removed screenshot theater and vague browse-the-UI steps where they did not create a real artifact.
- Tightened deployment lessons so they now require a real service definition or ingress path, not setup vibes.
- Kept lead-response and document-processing as the only production-pattern lessons so the track map matches the actual lesson intent.
