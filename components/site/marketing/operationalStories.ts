import type { Metadata } from 'next'

import {
  DEFAULT_X_HANDLE,
  buildPageMetadata,
  getCanonicalUrl,
  getSiteUrl,
} from '@/lib/seo'

export type OperationalStoryAction = {
  readonly href: string
  readonly label: string
}

export type OperationalStoryItem = {
  readonly body: string
  readonly href?: string
  readonly title: string
}

export type OperationalStorySection = {
  readonly body: string
  readonly eyebrow: string
  readonly items: readonly [
    OperationalStoryItem,
    OperationalStoryItem,
    OperationalStoryItem,
    OperationalStoryItem,
  ]
  readonly title: string
}

export type OperationalStory = {
  readonly breadcrumbLabel?: string
  readonly cta: {
    readonly actions: readonly [OperationalStoryAction, OperationalStoryAction]
    readonly body: string
    readonly eyebrow: string
    readonly title: string
  }
  readonly evidence: OperationalStorySection
  readonly hero: {
    readonly actions: readonly [OperationalStoryAction, OperationalStoryAction]
    readonly body: string
    readonly eyebrow: string
    readonly title: string
  }
  readonly index: string
  readonly path: `/${string}`
  readonly record: {
    readonly id: string
    readonly operation: string
    readonly status: string
  }
  readonly seo: {
    readonly description: string
    readonly keywords?: readonly string[]
    readonly socialDescription: string
    readonly title: string
    readonly twitterDescription: string
    readonly twitterTitle: string
    readonly webPageDescription: string
    readonly webPageName: string
  }
  readonly workflow: OperationalStorySection
}

const githubAction = {
  href: 'https://github.com/mutx-dev/mutx-dev',
  label: 'View on GitHub',
} as const

const downloadAction = { href: '/download', label: 'Download for Mac' } as const

export const operationalStories = {
  approvals: {
    index: '01',
    path: '/ai-agent-approvals',
    breadcrumbLabel: 'AI Agent Approvals',
    record: {
      id: 'AUTH-0142',
      operation: 'approval.request',
      status: 'WAITING ON OPERATOR',
    },
    seo: {
      title:
        'AI Agent Approval Workflows — Human-in-the-Loop Gates & Operator Authorization | MUTX',
      description:
        "Most agent approval systems are advisory — they suggest a review but don't block the action. MUTX approval gates are enforced by the control plane. The agent waits for a decision, and every decision is on the record.",
      keywords: [
        'ai agent approvals',
        'human in the loop ai agents',
        'ai agent approval workflow',
        'operator authorization',
        'approval gates for ai agents',
      ],
      socialDescription:
        'Enforced approval gates for AI agents. The agent waits for a human decision, the decision is recorded, and the record travels with the trace.',
      twitterTitle: 'AI Agent Approval Workflows | MUTX',
      twitterDescription:
        'Human-in-the-loop gates enforced by the control plane. Agents wait for operator decisions — no advisory-only approvals.',
      webPageName: 'AI Agent Approval Workflows | MUTX',
      webPageDescription:
        'Enforced approval gates for AI agents. Human-in-the-loop controls with operator routing, searchable audit records, and decision tracking built into the control plane.',
    },
    hero: {
      eyebrow: 'AI Agent Approvals',
      title: 'Real gates,\nnot rubber stamps.',
      body:
        'You can’t review every agent action, but you can require a human on the ones that matter. MUTX lets you define approval workflows for high-stakes agent operations, route those decisions to the right people, and keep the record attached to the runtime history.',
      actions: [downloadAction, { href: '/ai-agent-governance', label: 'Governance' }],
    },
    workflow: {
      eyebrow: 'How approvals work',
      title: 'Approvals that\nactually block execution.',
      body:
        'Most approval systems are advisory — they suggest a review but don’t stop the agent. MUTX approvals are control plane gates. The agent waits for the decision, and that decision travels with the trace.',
      items: [
        {
          title: 'Human-in-the-loop workflows',
          body:
            'Define which agent operations require a human sign-off before proceeding. Approval gates are control plane records — not a Slack message that may or may not get answered.',
        },
        {
          title: 'Operator authorization records',
          body:
            'Who approved what, when, and why — recorded with full execution context. The chain from request to approval to outcome, not a vague note that someone clicked approve.',
        },
        {
          title: 'Escalation paths',
          body:
            'Pending approvals route to the right operator instead of hoping the request appears in whichever notification channel happens to be watched that day.',
        },
        {
          title: 'Autonomous vs. approved',
          body:
            'Know what the agent did on its own versus what required human sign-off. That distinction stays visible in traces, cost attribution, and audit logs.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Common approval gates',
      title: 'Where teams put\na human in the loop.',
      body:
        'The first approval workflows are usually obvious: destructive operations, privileged access, policy exceptions, or actions expensive enough that they shouldn’t run without a second pair of eyes.',
      items: [
        {
          title: 'Production changes',
          body:
            'Deployments, config mutations, and other production-facing actions. Usually the first place teams add approval gates because the risk is obvious and the review path is clear.',
        },
        {
          title: 'Credential and access changes',
          body:
            'Requests that touch secrets, credentials, or privileged scopes are easier to reason about when the authorization event is explicit and lives in the same system as the action.',
        },
        {
          title: 'High-cost actions',
          body:
            'Some actions aren’t dangerous — they’re expensive. Approval workflows slow down high-cost runs before they burn through budget.',
        },
        {
          title: 'Policy exceptions',
          body:
            'When an agent hits a guardrail or policy boundary, the next step should be a deliberate operator workflow — not a silent fallback or a buried log line.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Define an approval gate.\nWatch it block.',
      body:
        'Download the Mac app, define an approval workflow for a high-stakes agent operation, and trigger it. Watch the gate block the operation, notify the right operator, and record the decision in the control plane.',
      actions: [downloadAction, githubAction],
    },
  },
  auditLogs: {
    index: '02',
    path: '/ai-agent-audit-logs',
    record: {
      id: 'AUDIT-7781',
      operation: 'trace.seal',
      status: 'EVIDENCE ATTACHED',
    },
    seo: {
      title:
        'AI Agent Audit Logs — Decision Records, Policy Traces, Compliance Exports | MUTX',
      description:
        'Complete trace history for every agent decision. MUTX records actions, policy evaluations, and operator overrides — so you can answer what happened and why, with the full execution context.',
      socialDescription:
        'Complete trace history for every agent decision. Records built for compliance and operator investigation.',
      twitterTitle: 'AI Agent Audit Logs | MUTX',
      twitterDescription:
        'Complete trace history for every agent decision. Records built for compliance and operator investigation.',
      webPageName: 'AI Agent Audit Logs | MUTX',
      webPageDescription:
        'Complete trace history for every agent decision. Records built for compliance and operator investigation.',
    },
    hero: {
      eyebrow: 'AI Agent Audit Logs',
      title: 'A record of what\nyour agents decided.',
      body:
        'When compliance asks what the agent decided and why, vague chat logs and “it ran successfully” messages won’t cut it. MUTX keeps a complete trace history with full execution context — so you can answer that question definitively, not with a summary.',
      actions: [downloadAction, { href: '/ai-agent-monitoring', label: 'Monitoring' }],
    },
    workflow: {
      eyebrow: 'Audit log properties',
      title: 'Logs built for answers,\nnot just retention.',
      body:
        'Most audit logs are written for compliance retention — not for anyone to actually read. MUTX audit logs are structured for investigation: every record has enough context to reconstruct what happened and understand why.',
      items: [
        {
          title: 'Decision records',
          body:
            'Every agent decision — what it tried, what tool it called, what it read or wrote, what the outcome was — recorded as a durable trace. Enough context to reconstruct what happened without asking the agent to explain itself.',
        },
        {
          title: 'Policy evaluation traces',
          body:
            'When a governance policy is evaluated, that evaluation is in the log: which policy version was active, what the input was, what the decision was. Not just pass/fail.',
        },
        {
          title: 'Operator accountability',
          body:
            'Who configured an agent, who approved a deployment, who overrode a guardrail — all in the audit log, attached to the trace they affected.',
        },
        {
          title: 'Compliance export',
          body:
            'Audit logs structured for compliance review. Filter by policy, operator, time range, or outcome. Export what compliance needs without giving them access to the full operational surface.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Connected surfaces',
      title: 'Everything feeds\nthe audit log.',
      body:
        'Audit logs aren’t a separate system in MUTX — they’re where everything in the control plane ends up. Governance evaluations, approval decisions, deployment records, and monitoring traces all attach to one record. The full picture in one place.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Policy evaluations are in the audit log — not just pass or fail, but the full evaluation trace with policy version and input context.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Traces feed the audit log. Every tool call, outcome, and error — in a record that satisfies compliance and helps operators reason about incidents.',
        },
        {
          title: 'Approvals',
          href: '/ai-agent-approvals',
          body:
            'Approval decisions — who approved, what they approved, the full context — are in the audit log. The complete chain from request to approval to outcome.',
        },
        {
          title: 'Guardrails',
          href: '/ai-agent-guardrails',
          body:
            'Guardrail violations are first-class audit events. You see the policy violated, the operation attempted, and the context — not just an error code.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Answer the question\nbefore compliance asks it.',
      body:
        'Download the Mac app. Run an agent. Open the audit log and see every decision, policy evaluation, and operator action — structured for compliance review and operator investigation alike.',
      actions: [
        downloadAction,
        { href: '/ai-agent-approvals', label: 'Approval workflows' },
      ],
    },
  },
  controlPlane: {
    index: '03',
    path: '/ai-agent-control-plane',
    record: {
      id: 'PLANE-0001',
      operation: 'agent.execute',
      status: 'RUNTIME VISIBLE',
    },
    seo: {
      title: 'AI Agent Control Plane - Runtime Traces, Lifecycle, Agent Setup | MUTX',
      description:
        'MUTX gives you runtime traces, agent lifecycle records, and a clear review dashboard for every agent in your workspace.',
      socialDescription:
        'Runtime traces, lifecycle records, and a clear review dashboard for every agent in your workspace.',
      twitterTitle: 'AI Agent Control Plane | MUTX',
      twitterDescription:
        'Runtime traces, lifecycle records, and review dashboards for agents from setup to daily use.',
      webPageName: 'AI Agent Control Plane | MUTX',
      webPageDescription:
        'Runtime traces, lifecycle records, and a clear review dashboard for every agent in your workspace.',
    },
    hero: {
      eyebrow: 'AI Agent Control Plane',
      title: 'The control plane\nis the product.',
      body:
        'Most agent tooling treats the control plane as an afterthought. MUTX makes it the place where setup, runtime visibility, and daily review all come together.',
      actions: [downloadAction, { href: '/ai-agent-deployment', label: 'Deployment' }],
    },
    workflow: {
      eyebrow: 'Control plane properties',
      title: 'Read the runtime.\nKeep context clear.',
      body:
        'When something changes in production, you need to see what happened, which tools ran, and which settings were active. MUTX keeps that context easy to read.',
      items: [
        {
          title: 'Runtime visibility',
          body:
            'See what your agents did. Traces, tool calls, context windows, and outcomes are collected in one place.',
        },
        {
          title: 'Agent lifecycle',
          body:
            'Every agent has a record: who created it, what runtime it uses, and which toolchain version was active.',
        },
        {
          title: 'Agent setup',
          body:
            'Set up agents, review their actions, and keep the important details visible without digging through logs.',
        },
        {
          title: 'Consistent settings',
          body:
            'Keep staging and production aligned with settings that travel with each agent configuration.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Cross-cutting concerns',
      title: 'One plane.\nEvery concern.',
      body:
        'Governance, cost, deployment, and observability belong in the same workspace. Policies, traces, and setup details stay connected as your agent fleet grows.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Auth boundaries and access controls enforced by the control plane, not by convention. They travel with the agent everywhere it runs.',
        },
        {
          title: 'Cost Management',
          href: '/ai-agent-cost',
          body:
            'Spend limits and rate limits are control plane properties. They are enforced in the runtime instead of scattered across individual API calls.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Traces and metrics surface through the control plane, tied to the agent definitions they describe.',
        },
        {
          title: 'Deployment',
          href: '/ai-agent-deployment',
          body:
            'Deployments are control plane records. What ran, when, with what config - versioned and readable in the same dashboard you use to operate the agent.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'See what your agents\nare actually doing.',
      body:
        'Download the Mac app and open the runtime workspace. Review agent traces, settings, and setup details in one place.',
      actions: [
        downloadAction,
        { href: '/docs/architecture/overview', label: 'Architecture overview' },
      ],
    },
  },
  cost: {
    index: '04',
    path: '/ai-agent-cost',
    breadcrumbLabel: 'AI Agent Cost Management',
    record: {
      id: 'COST-4200',
      operation: 'budget.evaluate',
      status: 'SPEND ATTRIBUTED',
    },
    seo: {
      title: 'AI Agent Cost Management — Per-Run Spend Tracking, Budgets, Attribution | MUTX',
      description:
        'Track AI agent costs by run, model, provider, and workflow. MUTX attributes spend in real time, enforces budgets at the control plane, and catches runaway agents before the invoice lands.',
      keywords: [
        'ai agent cost management',
        'llm cost tracking',
        'agent spend attribution',
        'ai agent budget controls',
        'runaway agent costs',
      ],
      socialDescription:
        'Track AI agent costs by run, model, provider, and workflow. Budgets and attribution built into the control plane.',
      twitterTitle: 'AI Agent Cost Management | MUTX',
      twitterDescription:
        'Track AI agent costs by run, model, provider, and workflow. Catch runaway spend before the invoice lands.',
      webPageName: 'AI Agent Cost Management | MUTX',
      webPageDescription:
        'Track AI agent costs by run, model, provider, and workflow. Budget enforcement and runtime context built into the control plane.',
    },
    hero: {
      eyebrow: 'AI Agent Cost Management',
      title: 'Know what your AI\nagents cost — per run.',
      body:
        'API bills don’t tell you which agent ran up $4k last Tuesday, which model earns its price, or which workflow is about to blow up the monthly budget. MUTX attributes LLM spend to the agent, the run, and the decision — with budgets enforced at the control plane.',
      actions: [downloadAction, { href: '/ai-agent-monitoring', label: 'Monitoring' }],
    },
    workflow: {
      eyebrow: 'Cost properties',
      title: 'Cost is a control\nplane concern.',
      body:
        'Most teams discover agent cost problems from the provider invoice. By then it’s too late. MUTX treats cost visibility and budget enforcement as first-class control plane properties — not afterthoughts bolted onto a billing export.',
      items: [
        {
          title: 'AI agent spend tracking',
          body:
            'Track spend per agent, model, provider, and workflow. MUTX answers which run is expensive — not just what the provider charged.',
        },
        {
          title: 'Per-run attribution',
          body:
            'Which agent burned $4,200 last Tuesday? MUTX ties spend to the actual agent record and runtime context. No reverse-engineering from an API key.',
        },
        {
          title: 'Budget enforcement',
          body:
            'Set spend limits per agent or per team. MUTX enforces them at the control plane — not by hoping application code checks the budget before every model call.',
        },
        {
          title: 'Model and provider visibility',
          body:
            'Compare which models and providers earn their cost. Rate limits and provider-level controls live on the agent definition — not in environment variables.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Failure modes',
      title: 'Catch expensive failures\nwhile the runtime is live.',
      body:
        'Agent cost management isn’t a finance dashboard. It’s a way to catch retry storms, stale workers, and runaway workflows before the billing cycle closes.',
      items: [
        {
          title: 'Runaway retry loops',
          body:
            'An agent retrying a broken tool path burns tokens invisibly. MUTX makes that spend attributable and interruptible — you see the loop, you stop the loop.',
        },
        {
          title: 'Background worker drift',
          body:
            'Long-running agents spend money quietly. Cost records stay attached to runtime history so you can inspect what happened before the budget report lands.',
        },
        {
          title: 'Approval-aware budgets',
          body:
            'High-cost actions are governance events. Budgets, approvals, and runtime controls share one review dashboard, not three disconnected tools.',
        },
        {
          title: 'Trace-linked investigations',
          body:
            'A cost spike is only useful if you can see the trace behind it. MUTX keeps spend next to monitoring and audit surfaces so operators can investigate fast.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Set a budget before\nyour agents set one for you.',
      body:
        'Download the Mac app. Define spend limits for your first agents. See what cost attribution looks like when it’s built into the control plane from day one.',
      actions: [downloadAction, githubAction],
    },
  },
  deployment: {
    index: '05',
    path: '/ai-agent-deployment',
    record: {
      id: 'DEPLOY-0317',
      operation: 'release.promote',
      status: 'ROLLBACK READY',
    },
    seo: {
      title: 'AI Agent Deployment — Repeatable Envs, Audit Trails, Rollback | MUTX',
      description:
        'Agents that deploy like services, not science projects. MUTX gives you repeatable runtime environments, deployment records with audit trails, and one-click rollback.',
      socialDescription:
        'Agents that deploy like services. Repeatable environments, deployment records, and rollback paths — built into the control plane.',
      twitterTitle: 'AI Agent Deployment | MUTX',
      twitterDescription:
        'Agents that deploy like services. Repeatable environments and deployment records built into the control plane.',
      webPageName: 'AI Agent Deployment | MUTX',
      webPageDescription:
        'Agents that deploy like services. Repeatable environments, deployment records, and rollback paths — built into the control plane.',
    },
    hero: {
      eyebrow: 'AI Agent Deployment',
      title: 'Ship agents\nlike services.',
      body:
        'Agents shouldn’t need custom deployment scripts held together by convention and prayer. MUTX treats deployment as a first-class record — repeatable environments, rollback paths, and audit trails that make what shipped visible to your whole team.',
      actions: [downloadAction, { href: '/ai-agent-control-plane', label: 'Control Plane' }],
    },
    workflow: {
      eyebrow: 'Deployment properties',
      title: 'Deployment is a record.\nNot a prayer.',
      body:
        'Most agent tooling doesn’t have a deployment concept — just a script that runs and crosses its fingers. MUTX makes deployment a durable record. Audit what changed. Roll back what broke. Reason about production state without guessing.',
      items: [
        {
          title: 'Repeatable environments',
          body:
            'Define a runtime environment once. Deploy the same config to staging and production without surprises — because the environment is the artifact, not a script someone wrote months ago and nobody touched since.',
        },
        {
          title: 'Deployment records',
          body:
            'Every deployment is a record. What changed, who shipped it, what runtime config was active. Reason backward from a production incident instead of forward from a Slack message.',
        },
        {
          title: 'Rollback paths',
          body:
            'Rolling back should be a defined action — not a heroic improvisation at 11 PM. MUTX keeps the previous deployment state accessible so rollback is explicit, auditable, and fast.',
        },
        {
          title: 'Environment parity',
          body:
            'Local, staging, and production should behave the same because the control plane enforces it — not because the team agreed they ‘probably should’ and moved on.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Connected surfaces',
      title: 'Everything flows from\nthe deployment record.',
      body:
        'When deployment is a first-class control plane record, governance policies, cost limits, and monitoring all attach cleanly. The deployment is the artifact. Everything else branches from it.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Governance policies travel with the deployment. Promote an agent to production and auth boundaries go with it — no separate config you have to remember to update at 5 PM on a Friday.',
        },
        {
          title: 'Cost Management',
          href: '/ai-agent-cost',
          body:
            'Spend budgets and rate limits attach to the deployment record. The same limits that worked in staging are live in production — enforced by the control plane, not by memory.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Monitoring traces attach to deployment records. Investigate an incident and see which deployment is running and what changed — not just a wall of timestamps.',
        },
        {
          title: 'Reliability',
          href: '/ai-agent-reliability',
          body:
            'Health checks and readiness probes are part of the deployment record. The agent isn’t “running” until the control plane confirms it — not when a process starts in the background and everyone hopes for the best.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Deploy an agent.\nSee the record.',
      body:
        'Download the Mac app, deploy your first agent, and see what the deployment record looks like when it’s built around auditability and rollback — not around whatever was easiest to hack together.',
      actions: [
        downloadAction,
        { href: '/docs/deployment/quickstart', label: 'Deployment quickstart' },
      ],
    },
  },
  governance: {
    index: '06',
    path: '/ai-agent-governance',
    record: {
      id: 'GOV-2104',
      operation: 'policy.evaluate',
      status: 'BOUNDARY ENFORCED',
    },
    seo: {
      title:
        'AI Agent Governance — Auth Boundaries, Access Control & Audit Compliance | MUTX',
      description:
        'Agent access is a minefield of implicit permissions and undocumented API keys. MUTX bakes auth boundaries, operator access controls, and compliance audit trails into the control plane — so what every agent can do is explicit, versioned, and enforced.',
      socialDescription:
        'Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions.',
      twitterTitle: 'AI Agent Governance | MUTX',
      twitterDescription:
        'Auth boundaries and compliance guardrails baked into the control plane. Agent access stays explicit and auditable.',
      webPageName: 'AI Agent Governance | MUTX',
      webPageDescription:
        'Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions, no undocumented access.',
    },
    hero: {
      eyebrow: 'AI Agent Governance',
      title: 'Lock down what\nevery agent can touch.',
      body:
        'Agents with implicit permissions, undocumented tool access, and loose API keys are how projects implode in production. MUTX makes every agent’s access boundaries explicit, versioned, and enforced — everywhere the agent runs.',
      actions: [downloadAction, { href: '/ai-agent-control-plane', label: 'Control Plane' }],
    },
    workflow: {
      eyebrow: 'How governance works',
      title: 'Policies that follow\nthe agent.',
      body:
        'Most platforms bolt governance onto each deployment. The moment an agent moves environments or changes hands, policies drift. MUTX governance is wired into the control plane — it follows the agent everywhere.',
      items: [
        {
          title: 'Auth boundaries',
          body:
            'Pin what each agent can touch — APIs, data sources, tools. The control plane enforces these boundaries in every environment the agent runs in. No environment-specific config drift.',
        },
        {
          title: 'Operator access control',
          body:
            'Decide who can configure, operate, or observe each agent. RBAC that lives in the agent definition, not in some environment config nobody opens.',
        },
        {
          title: 'Compliance guardrails',
          body:
            'Data handling policies and access logs that satisfy compliance without slowing down development. Audit records that exist because the system writes them, not because someone remembered to add logging.',
        },
        {
          title: 'Policy-as-code',
          body:
            'Governance policies written in code, versioned with agent definitions, enforced by the control plane. The policy lives next to the agent — not in a Google doc nobody updates.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Runs through every layer',
      title: 'Governance isn’t a bolt-on.\nIt’s the foundation.',
      body:
        'MUTX governance isn’t an add-on. It runs through the control plane from deployment to monitoring. Every agent action is evaluated against your policies automatically — not enforced by convention or hope.',
      items: [
        {
          title: 'Control Plane',
          href: '/ai-agent-control-plane',
          body:
            'Auth boundaries and operator access controls enforced at the runtime layer. Governance starts here — it’s not just documented, it’s enforced.',
        },
        {
          title: 'Deployment',
          href: '/ai-agent-deployment',
          body:
            'Policies are versioned with deployment configs. What runs in production is exactly what you reviewed — no gap between intention and reality.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Auth failures and policy violations surface as first-class events. You see when an agent hit a boundary — not just when something broke.',
        },
        {
          title: 'Audit Logs',
          href: '/ai-agent-audit-logs',
          body:
            'Every access decision, policy evaluation, and operator action — recorded by the control plane, not retrofitted into a logging service after the fact.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Ship your first\nagent auth boundary.',
      body:
        'Download the Mac app and define auth boundaries in code. Apply them to one agent or your whole fleet — the control plane handles enforcement across every environment.',
      actions: [
        downloadAction,
        { href: '/ai-agent-approvals', label: 'Approval workflows' },
      ],
    },
  },
  guardrails: {
    index: '07',
    path: '/ai-agent-guardrails',
    record: {
      id: 'GUARD-9880',
      operation: 'boundary.check',
      status: 'POLICY ENFORCED',
    },
    seo: {
      title: 'AI Agent Guardrails — Runtime Policy Enforcement & Safety Boundaries | MUTX',
      description:
        "Agents without guardrails will find every edge case — including the ones you didn't anticipate. MUTX enforces safety policies at runtime and surfaces violations as first-class events, not buried log lines.",
      socialDescription:
        'Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events.',
      twitterTitle: 'AI Agent Guardrails | MUTX',
      twitterDescription:
        'Safety policies enforced at runtime by the control plane. Violations surface as first-class events.',
      webPageName: 'AI Agent Guardrails | MUTX',
      webPageDescription:
        'Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events with full context.',
    },
    hero: {
      eyebrow: 'AI Agent Guardrails',
      title: 'Draw the line on\nwhat agents can’t do.',
      body:
        'An agent without guardrails will probe every edge case — especially the ones you never wanted it to find. MUTX lets you write safety policies, enforce them at runtime, and surface violations as first-class events instead of silent failures buried in a log file nobody opens.',
      actions: [downloadAction, { href: '/ai-agent-governance', label: 'Governance' }],
    },
    workflow: {
      eyebrow: 'How guardrails work',
      title: 'Safety policies,\nnot safety theater.',
      body:
        'Most guardrail setups check a compliance box without blocking anything real. MUTX guardrails are enforced by the control plane at runtime — not by prompt instructions a capable model will sidestep when the stakes are high.',
      items: [
        {
          title: 'Runtime policy enforcement',
          body:
            'Pin what agents can call, what data they can touch, what operations are off-limits. MUTX evaluates these policies at runtime — not at write-time, not in code review.',
        },
        {
          title: 'Safety boundaries',
          body:
            'Hard walls around operations that should never happen — destructive tool calls, sensitive data access, unattended privileged operations. Boundaries that follow the agent across environments.',
        },
        {
          title: 'Violation visibility',
          body:
            'When a guardrail fires, you see it immediately. Violations surface as first-class events — the violated policy, the attempted operation, and the triggering context. Not a buried log line.',
        },
        {
          title: 'Policy versioning',
          body:
            'Guardrail policies version with the agent definition. You can check which policy was active during a violation, roll back, and test policy changes against real traces before shipping.',
        },
      ],
    },
    evidence: {
      eyebrow: 'How guardrails connect',
      title: 'Guardrails are\ngovernance, enforced.',
      body:
        'Auth boundaries and compliance requirements become guardrail policies in MUTX. When a violation fires, it surfaces in monitoring, gets recorded in the audit log, and can trip a circuit breaker — all coordinated by the control plane.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Guardrails turn governance policies into runtime enforcement. The abstract auth boundary in your governance model becomes the concrete guardrail that fires in production.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Guardrail violations are first-class monitoring events. The policy that was violated, the operation attempted, the surrounding context — not just an error code.',
        },
        {
          title: 'Reliability',
          href: '/ai-agent-reliability',
          body:
            'Guardrail violations can trip circuit breakers. A repeated policy violation isn’t just a compliance issue — it’s a reliability signal the control plane can act on.',
        },
        {
          title: 'Audit Logs',
          href: '/ai-agent-audit-logs',
          body:
            'Every violation is logged with the policy version, the attempted operation, and the context. Records that satisfy compliance reviews — not just developer curiosity.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Write a policy.\nBreak it on purpose.',
      body:
        'Download the Mac app, write a guardrail policy, and trigger the violation deliberately. See the violation event in the control plane, check the audit log entry, and understand what operators see before users are affected.',
      actions: [downloadAction, githubAction],
    },
  },
  infrastructure: {
    index: '08',
    path: '/ai-agent-infrastructure',
    record: {
      id: 'INFRA-6032',
      operation: 'runtime.resolve',
      status: 'TOPOLOGY VISIBLE',
    },
    seo: {
      title: 'AI Agent Infrastructure — Compute, Secrets, Storage, Network | MUTX',
      description:
        'Stop guessing where your agents run. MUTX surfaces compute, secrets, and storage as explicit control plane properties — auditable, versioned, and visible.',
      socialDescription:
        'Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.',
      twitterTitle: 'AI Agent Infrastructure | MUTX',
      twitterDescription:
        'Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.',
      webPageName: 'AI Agent Infrastructure | MUTX',
      webPageDescription:
        'Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.',
    },
    hero: {
      eyebrow: 'AI Agent Infrastructure',
      title: 'Infrastructure you\ncan actually see.',
      body:
        'Your agent infrastructure shouldn’t be a pile of one-off scripts, stale docs, and secrets nobody remembers provisioning. MUTX makes compute, storage, and secrets legible and versioned — so you own what runs in production, not just hope it works.',
      actions: [downloadAction, { href: '/ai-agent-control-plane', label: 'Control Plane' }],
    },
    workflow: {
      eyebrow: 'Infrastructure properties',
      title: 'Know what’s running.\nOwn why.',
      body:
        'Most agent infra is implicit — a shared doc that hasn’t been updated since Q1, a hosting console disconnected from the agent definition, and a tribal knowledge base that walks out the door with your senior engineer. MUTX makes infrastructure explicit, versioned, and auditable.',
      items: [
        {
          title: 'Compute management',
          body:
            'Where agents run is part of the control plane record. Compute allocation, scheduling, and scaling are surfaced as explicit properties — not buried in a hosting provider’s console you check after something breaks.',
        },
        {
          title: 'Secrets management',
          body:
            'API keys and credentials live in the control plane — not scattered across .env files, CI variables, and someone’s notes app. Rotated, versioned, and attached to the agents that use them.',
        },
        {
          title: 'Storage layer',
          body:
            'What the agent reads, what it writes, and how long that state persists — all explicit. No orphaned state blobs living outside the system’s awareness.',
        },
        {
          title: 'Network topology',
          body:
            'Which services the agent can reach, which endpoints it’s allowed to call, and how traffic routes out — defined in the control plane, not discovered during an incident.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Connected surfaces',
      title: 'Infra isn’t a side quest.\nIt’s the foundation.',
      body:
        'When infrastructure lives in the control plane, it connects to governance, deployment, and cost — no manual reconciliation. Secrets attach to agent records. Network policies enforce at the infra layer. Compute spend shows up in cost attribution.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Network topology and secrets are governance surface. What the agent can access is determined by infra config, governed by the control plane — not left to convention and good intentions.',
        },
        {
          title: 'Deployment',
          href: '/ai-agent-deployment',
          body:
            'Compute and storage config travel with the deployment record. Promote an agent to production and the infra config goes with it — no copy-paste, no manual sync.',
        },
        {
          title: 'Cost Management',
          href: '/ai-agent-cost',
          body:
            'Compute allocation maps directly to cost attribution. A spend spike shows you which compute resources were running — not just a pile of API call records.',
        },
        {
          title: 'Guardrails',
          href: '/ai-agent-guardrails',
          body:
            'Safety boundaries and network policies enforced at the infra layer. Guardrail violations related to network access show up with full infrastructure context — not in a separate dashboard you never check.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'See your infra.\nAll of it.',
      body:
        'Download the Mac app and open the infrastructure surface. See where agents run, what secrets they hold, and what your network topology actually looks like when it’s defined instead of assumed.',
      actions: [
        downloadAction,
        { href: '/docs/architecture/overview', label: 'Architecture overview' },
      ],
    },
  },
  monitoring: {
    index: '09',
    path: '/ai-agent-monitoring',
    record: {
      id: 'TRACE-1187',
      operation: 'tool.invoke',
      status: 'OUTCOME RECORDED',
    },
    seo: {
      title:
        'AI Agent Monitoring — Execution Traces, Tool Call History, Outcome Records | MUTX',
      description:
        "See what agents actually did — not what they said they'd do. MUTX captures execution traces, tool call chains, and outcomes so your team can investigate incidents and fix behavior in production.",
      socialDescription:
        'See what agents actually did. Execution traces, tool call history, and outcomes — built into the control plane.',
      twitterTitle: 'AI Agent Monitoring | MUTX',
      twitterDescription:
        "See what agents actually did, not what they said they'd do. Runtime traces and tool call history in the control plane.",
      webPageName: 'AI Agent Monitoring | MUTX',
      webPageDescription:
        'See what agents actually did. Execution traces, tool call history, and outcome records — built into the control plane.',
    },
    hero: {
      eyebrow: 'AI Agent Monitoring',
      title: 'See what agents\nactually did.',
      body:
        'When something breaks in production, you need to reason backward from what the agent actually executed — not forward from what the model promised. MUTX captures the full execution trace: model calls, tool invocations, context changes, and outcomes. Built for investigation, not just alerting.',
      actions: [downloadAction, { href: '/ai-agent-control-plane', label: 'Control Plane' }],
    },
    workflow: {
      eyebrow: 'Observability properties',
      title: 'Traces, not tail outputs.',
      body:
        'Traditional monitoring tells you something happened. MUTX traces tell you what the agent did — the full execution path, the tool call chain, the outcome. Information structured for investigation, not just alerting.',
      items: [
        {
          title: 'Execution traces',
          body:
            'The full sequence of what the agent did — every model call, tool invocation, and context window change. Not a self-summary. The actual trace.',
        },
        {
          title: 'Tool call history',
          body:
            'Which tool was called, with what arguments, in what order, and what came back. The information you need to understand why an agent chose a path.',
        },
        {
          title: 'Outcome records',
          body:
            'What the agent produced, where it wrote state, what external calls it made. Reason backward from results instead of guessing forward from prompt intentions.',
        },
        {
          title: 'Alert routing',
          body:
            'When something in the trace looks wrong, alerts route to the right operator — not a generic inbox nobody reads. Alerts attach to agent records, not a SIEM.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Connected surfaces',
      title: 'Monitoring is the payoff\nfor good control.',
      body:
        'When governance, deployment, and cost share one control plane, monitoring traces attach to all of them. You see the deployment that shipped, the policy that was evaluated, and the cost that was incurred — in the same trace.',
      items: [
        {
          title: 'Governance',
          href: '/ai-agent-governance',
          body:
            'Auth failures and policy violations are first-class trace events. You see when an agent hit a boundary and what it tried to do — not just the error in the logs.',
        },
        {
          title: 'Deployment',
          href: '/ai-agent-deployment',
          body:
            'Traces attach to deployment records. Investigate a production incident and you see which deployment is running and what changed — not just a timestamp.',
        },
        {
          title: 'Cost Management',
          href: '/ai-agent-cost',
          body:
            'Cost spikes surface through the monitoring view with corresponding traces. You see the spend anomaly and the execution trace in the same incident.',
        },
        {
          title: 'Audit Logs',
          href: '/ai-agent-audit-logs',
          body:
            'Traces feed the audit log. Every action recorded with enough context to satisfy a compliance review — not a generic “agent ran successfully” entry.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Watch the runtime\ndo something real.',
      body:
        'Download the Mac app. Run an agent. Open the trace view and see what it actually did — every tool call, context window change, and outcome. Then compare that to what you thought it would do.',
      actions: [
        downloadAction,
        { href: '/ai-agent-cost', label: 'Cost management' },
      ],
    },
  },
  reliability: {
    index: '10',
    path: '/ai-agent-reliability',
    record: {
      id: 'HEALTH-0042',
      operation: 'probe.readiness',
      status: 'CIRCUIT HEALTHY',
    },
    seo: {
      title: 'AI Agent Reliability — Health Checks, Circuit Breakers, Failover | MUTX',
      description:
        'Agents that survive production. MUTX runs health probes, enforces circuit breakers, and routes around failures — so operators catch degradation before users do.',
      socialDescription:
        'Agents that survive production. Health checks, circuit breakers, and operator visibility — built into the control plane.',
      twitterTitle: 'AI Agent Reliability | MUTX',
      twitterDescription:
        'Agents that survive production. Health checks and circuit breakers built into the control plane.',
      webPageName: 'AI Agent Reliability | MUTX',
      webPageDescription:
        'Agents that survive production. Health checks, circuit breakers, and operator visibility — built into the control plane.',
    },
    hero: {
      eyebrow: 'AI Agent Reliability',
      title: 'Agents that\nsurvive production.',
      body:
        'Shipping an agent to production and hoping for the best isn’t a reliability strategy. MUTX runs health probes, enforces circuit breakers, and routes around failures — so operators catch degradation before users report it.',
      actions: [downloadAction, { href: '/ai-agent-monitoring', label: 'Monitoring' }],
    },
    workflow: {
      eyebrow: 'Reliability properties',
      title: 'Reliability is a control\nplane property.',
      body:
        'Most agent tooling assumes the model will behave. MUTX doesn’t. Health checks, circuit breakers, and explicit operational state give operators something to read and act on — before the model has a bad day.',
      items: [
        {
          title: 'Health checks',
          body:
            'Not just “is the process running” but “is the agent responsive, is the control plane reachable, is the toolchain intact.” MUTX confirms health before declaring an agent operational.',
        },
        {
          title: 'Readiness probes',
          body:
            'An agent that just started isn’t ready. MUTX defines readiness as an explicit state — context warmed, tools loaded, ready to handle requests.',
        },
        {
          title: 'Circuit breakers',
          body:
            'When an agent hits persistent errors or a downstream service degrades, MUTX trips the circuit breaker before cascading failures spread.',
        },
        {
          title: 'Failover paths',
          body:
            'When an agent instance fails, the control plane routes requests to a healthy instance. No human intervention required.',
        },
      ],
    },
    evidence: {
      eyebrow: 'Connected surfaces',
      title: 'Reliability connects to\nthe rest of the plane.',
      body:
        'When reliability standards live in the control plane, circuit breakers integrate with cost enforcement, failover routes based on deployment records, and health checks feed the audit log — without stitching together separate monitoring tools.',
      items: [
        {
          title: 'Cost Management',
          href: '/ai-agent-cost',
          body:
            'Circuit breakers and spend limits work together. When an agent hits its cost ceiling, the control plane throttles it — before it becomes a runaway API bill.',
        },
        {
          title: 'Deployment',
          href: '/ai-agent-deployment',
          body:
            'Health checks are part of the deployment record. The agent isn’t “deployed” in MUTX until it passes its health probe — not just until the deploy command exits.',
        },
        {
          title: 'Monitoring',
          href: '/ai-agent-monitoring',
          body:
            'Circuit breaker trips and health check failures surface through the monitoring view. Operators see the degradation with full context — before customers report it.',
        },
        {
          title: 'Guardrails',
          href: '/ai-agent-guardrails',
          body:
            'When a guardrail violation triggers a circuit breaker, the response is coordinated by the control plane — not handled by two systems that disagree on what happened.',
        },
      ],
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Ship an agent. Watch the\nhealth surface respond.',
      body:
        'Download the Mac app. Deploy an agent. Open the reliability surface and see what the health probe reports, what happens when you trip a circuit breaker, and what the operator sees before the incident reaches users.',
      actions: [downloadAction, { href: '/docs/quickstart', label: 'Read quickstart' }],
    },
  },
} as const satisfies Record<string, OperationalStory>

export function buildOperationalStoryMetadata(story: OperationalStory): Metadata {
  return {
    title: story.seo.title,
    description: story.seo.description,
    ...(story.seo.keywords ? { keywords: [...story.seo.keywords] } : {}),
    ...buildPageMetadata({
      title: story.seo.title,
      description: story.seo.description,
      path: story.path,
      socialDescription: story.seo.socialDescription,
      twitterTitle: story.seo.twitterTitle,
      twitterDescription: story.seo.twitterDescription,
    }),
  }
}

export function buildOperationalStoryStructuredData(story: OperationalStory) {
  const siteUrl = getSiteUrl()
  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'MUTX',
      url: siteUrl,
      sameAs: [`https://x.com/${DEFAULT_X_HANDLE.replace('@', '')}`],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'MUTX',
      applicationCategory: 'DeveloperApplication',
      description:
        'Source-available control plane for AI agent governance, deployment, and observability.',
      downloadUrl: `${siteUrl}/download`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'WebPage',
      name: story.seo.webPageName,
      url: getCanonicalUrl(story.path),
      description: story.seo.webPageDescription,
      isPartOf: { '@type': 'WebSite', name: 'MUTX', url: siteUrl },
    },
  ]

  if (story.breadcrumbLabel) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'MUTX',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: story.breadcrumbLabel,
          item: getCanonicalUrl(story.path),
        },
      ],
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
