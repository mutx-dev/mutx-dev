# latest.md — Project Shepherd

## Status
**State:** YELLOW, MOVING, AND NO LONGER IN BOOTSTRAP MODE.

Material change: the promoted fleet is now producing real artifacts. Every promoted lane has a first `reports/latest.md`, and `lane-scorecard.md` is present. The old story about blank lanes is stale. The control problem has shifted: not coverage, but convergence.

## Top 3 cross-lane priorities
1. **Lock the design-partner-ready first 15 minutes**
   - One truthful install/download → auth → deploy → inspect path, turned into a proof asset and POC motion.
2. **Run post-close truth audits on `#117` and `#39`**
   - Resolve deployment-parity ambiguity and make runtime/monitoring truth visible in the operator layer.
3. **Harden trust boundaries**
   - Fix the gateway exposure posture and the fail-open SSH provisioning path before expanding shared automation.

## Blockers, stale lanes, and unowned work
- **No blank promoted lanes remain.** First-report coverage exists across product, build, GTM, control, and reporting.
- **Main blocker:** cross-lane disagreement on `#117`. Product Manager treats deployment parity as materially landed; workflow/docs/reporting/GTM still treat it as the main open wedge. That needs one audit, not more parallel opinion.
- **Main blocker:** `#39` still has an operator-truth gap. Backend health signals exist, but dashboard/docs/operator UX still underrepresent runtime state.
- **Trust blocker:** gateway security posture is too open for shared use, and the Ansible path still fails open on SSH.
- **Degraded lane:** X distribution remains red / unclear, so social/distribution claims must stay conservative.
- **Stale work now:** control-file drift behind live lane reports, not missing lane activity.
- **Unowned unless assigned clearly:** the final canonical first-15-minutes proof artifact that spans product truth, GTM packaging, and reporting.

## Owner map
| Priority | Primary owners | Immediate output expected |
| --- | --- | --- |
| First 15 minutes proof path | product-manager, developer-advocate, sales-engineer, account-strategist, outbound-strategist | one named walkthrough / POC brief that sales and design-partner outreach can actually use |
| Post-close truth audits (`#117`, `#39`) | workflow-architect, technical-writer, ai-engineer, frontend-developer, project-shepherd | one reconciled truth brief covering deployment parity, runtime health visibility, and conservative supported claims |
| Trust-boundary hardening | infrastructure-maintainer, security-engineer | one approval-ready hardening brief covering gateway posture and fail-closed SSH provisioning |
| Distribution discipline | social-media-strategist, report-distribution-agent | one conservative distribution/reporting line that does not outrun product/runtime reality |

## Control call
Do not reopen bootstrap narratives. The fleet is on. The next leverage is to make the product story, operator truth, and trust boundary say the same thing.
