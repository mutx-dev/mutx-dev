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

export type OperationalStoryPoint = {
  readonly body: string
  readonly title: string
}

export type OperationalStoryExampleField = {
  readonly label: string
  readonly value: string
}

export type OperationalStory = {
  readonly breadcrumbLabel: string
  readonly destination: OperationalStoryAction
  readonly example: {
    readonly category: string
    readonly fields: readonly OperationalStoryExampleField[]
    readonly state: string
    readonly subject: string
  }
  readonly hero: {
    readonly body: string
    readonly eyebrow: string
    readonly scopeNote: string
    readonly title: string
  }
  readonly path: `/${string}`
  readonly section: {
    readonly body: string
    readonly points: readonly [OperationalStoryPoint, OperationalStoryPoint]
    readonly title: string
  }
  readonly seo: {
    readonly description: string
    readonly keywords: readonly string[]
    readonly socialDescription: string
    readonly title: string
    readonly twitterDescription: string
    readonly twitterTitle: string
    readonly webPageDescription: string
    readonly webPageName: string
  }
}

export const operationalStories = {
  approvals: {
    path: '/ai-agent-approvals',
    breadcrumbLabel: 'AI Agent Approvals',
    hero: {
      eyebrow: 'Approvals',
      title: 'Review a tool call. Then decide.',
      body:
        'MUTX can stop a registered tool before it runs. The approvals API stores a separate operator decision.',
      scopeNote:
        'Your integration must connect that decision to the original tool call.',
    },
    example: {
      category: 'Approval request',
      subject: 'Share the vendor summary',
      state: 'Waiting for a decision',
      fields: [
        { label: 'Tool', value: 'documents.share' },
        { label: 'Destination', value: 'External workspace' },
        { label: 'Decision', value: 'Operator review' },
      ],
    },
    section: {
      title: 'Separate the request from the decision.',
      body:
        'MUTX keeps the runtime stop and the approval record in separate contracts so an integration can connect them explicitly.',
      points: [
        {
          title: 'The runtime can stop the tool.',
          body: 'When policy requires review, the tool stops before it runs.',
        },
        {
          title: 'The API stores the decision.',
          body: 'An approval record tracks its reviewer and outcome. Your integration controls what happens next.',
        },
      ],
    },
    destination: { href: '/dashboard/approvals', label: 'Open approvals' },
    seo: {
      title: 'AI Agent Approval Requests | MUTX',
      description:
        'Stop selected registered tool calls before they run, and keep a separate record of the operator decision.',
      keywords: ['AI agent approvals', 'tool call review', 'human review for AI agents'],
      socialDescription:
        'MUTX can stop a registered tool call and store an operator decision in a separate approval record.',
      twitterTitle: 'AI Agent Approvals | MUTX',
      twitterDescription:
        'Review a tool call, record the decision, and connect it to the original call in your integration.',
      webPageName: 'AI Agent Approvals | MUTX',
      webPageDescription:
        'Runtime tool stops and approval records for operator review, with continuation handled by the integration.',
    },
  },
  auditLogs: {
    path: '/ai-agent-audit-logs',
    breadcrumbLabel: 'AI Agent Audit Records',
    hero: {
      eyebrow: 'Audit records',
      title: 'Inspect the record behind a tool call.',
      body:
        'Open a governed tool decision or review run traces sent by an instrumented integration.',
      scopeNote:
        'Run traces cover only the events connected systems send.',
    },
    example: {
      category: 'Governed tool record',
      subject: 'documents.share',
      state: 'Policy decision',
      fields: [
        { label: 'Result', value: 'Deferred before execution' },
        { label: 'Evidence', value: 'Hash-chained runtime event' },
        { label: 'Source', value: 'MUTX runtime' },
      ],
    },
    section: {
      title: 'Keep both evidence sources visible.',
      body:
        'Governed calls and submitted traces answer different questions. MUTX shows where each record came from.',
      points: [
        {
          title: 'Governed calls',
          body: 'Hash-chained events record policy decisions and observed results for registered runtime tools.',
        },
        {
          title: 'Submitted activity',
          body: 'Connected systems add the run traces and adapter events they send to MUTX.',
        },
      ],
    },
    destination: { href: '/dashboard/audit', label: 'Open audit records' },
    seo: {
      title: 'AI Agent Audit Records and Run Traces | MUTX',
      description:
        'Review hash-chained events for governed MUTX runtime calls and run traces submitted by connected integrations.',
      keywords: ['AI agent audit records', 'governed runtime evidence', 'agent run traces'],
      socialDescription:
        'Inspect governed-call evidence alongside run traces submitted by connected integrations.',
      twitterTitle: 'AI Agent Audit Records | MUTX',
      twitterDescription:
        'Read the source of each record: a governed tool call or activity sent by an integration.',
      webPageName: 'AI Agent Audit Records | MUTX',
      webPageDescription:
        'Hash-chained governed-call events and submitted activity for operator review.',
    },
  },
  controlPlane: {
    path: '/ai-agent-control-plane',
    breadcrumbLabel: 'AI Agent Control Plane',
    hero: {
      eyebrow: 'Control plane',
      title: 'Your agents, in one place.',
      body:
        'Review agent records, lifecycle changes, reported usage, and run evidence in the MUTX control plane.',
      scopeNote:
        'Run and health details depend on what connected systems report.',
    },
    example: {
      category: 'Agent record',
      subject: 'Example agent',
      state: 'Operator view',
      fields: [
        { label: 'Lifecycle', value: 'Desired state and events' },
        { label: 'Run detail', value: 'Submitted traces' },
        { label: 'Usage', value: 'Reported by integration' },
      ],
    },
    section: {
      title: 'Move between records and activity.',
      body:
        'The control plane brings owned agent data and runtime evidence into one operator workflow.',
      points: [
        {
          title: 'Start with the agent record.',
          body: 'Review configuration, desired state, and lifecycle updates stored by MUTX.',
        },
        {
          title: 'Read activity with its source.',
          body: 'Keep submitted traces, reported usage, and governed-call evidence distinct.',
        },
      ],
    },
    destination: { href: '/control/agents', label: 'Browse agent records' },
    seo: {
      title: 'AI Agent Control Plane | MUTX',
      description:
        'Explore MUTX workflows for agent records, lifecycle changes, reported usage, submitted traces, and governed calls.',
      keywords: ['AI agent control plane', 'agent operator workspace', 'agent lifecycle records'],
      socialDescription:
        'Review agent records and the activity or usage that connected systems report.',
      twitterTitle: 'AI Agent Control Plane | MUTX',
      twitterDescription:
        'Move between agent configuration, lifecycle records, submitted traces, usage, and governed calls.',
      webPageName: 'AI Agent Control Plane | MUTX',
      webPageDescription:
        'MUTX operator workflows for agent records, lifecycle changes, usage, submitted traces, and governed calls.',
    },
  },
  cost: {
    path: '/ai-agent-cost',
    breadcrumbLabel: 'AI Agent Usage',
    hero: {
      eyebrow: 'Usage',
      title: 'Follow your agents’ usage.',
      body:
        'Read credits and resource usage sent by connected runtimes.',
      scopeNote:
        'MUTX reports usage; your runtime decides whether to act on a threshold.',
    },
    example: {
      category: 'Usage summary',
      subject: 'Example agent',
      state: 'Reported input',
      fields: [
        { label: 'Credits', value: 'Sent by integration' },
        { label: 'Resource use', value: 'Sent by runtime' },
        { label: 'Grouping', value: 'Agent and period, when supplied' },
      ],
    },
    section: {
      title: 'Read the report before you set a limit.',
      body:
        'MUTX groups reported usage by agent and time window when the source provides those details.',
      points: [
        {
          title: 'Check the source fields.',
          body: 'Credit and resource values come from connected callers or runtimes.',
        },
        {
          title: 'Wire enforcement in your runtime.',
          body: 'A threshold changes execution only when the runtime owner connects it to an action.',
        },
      ],
    },
    destination: { href: '/dashboard/budgets', label: 'Open usage and budgets' },
    seo: {
      title: 'AI Agent Usage Reporting | MUTX',
      description:
        'Review credits and resource usage reported by connected systems, grouped by agent and time window when source details are available.',
      keywords: ['AI agent usage reporting', 'reported AI resource usage', 'agent credit summaries'],
      socialDescription:
        'Review caller-reported credits and resource usage; enforcement remains with the runtime.',
      twitterTitle: 'AI Agent Usage | MUTX',
      twitterDescription:
        'Follow reported usage with the source fields needed to group it by agent or time window.',
      webPageName: 'AI Agent Usage Reporting | MUTX',
      webPageDescription:
        'Reported credit and resource inputs for operator review and monthly summaries.',
    },
  },
  deployment: {
    path: '/ai-agent-deployment',
    breadcrumbLabel: 'AI Agent Deployment Records',
    hero: {
      eyebrow: 'Deployment',
      title: 'Track deployment changes.',
      body:
        'Keep desired configuration, versions, and lifecycle events on one deployment record.',
      scopeNote:
        'A MUTX record does not show that a hosting provider applied the change.',
    },
    example: {
      category: 'Deployment record',
      subject: 'Example deployment',
      state: 'Desired configuration',
      fields: [
        { label: 'Version', value: 'Stored in MUTX' },
        { label: 'Lifecycle', value: 'Events recorded' },
        { label: 'Provider result', value: 'Reported by integration' },
      ],
    },
    section: {
      title: 'Track the record. Verify the provider change.',
      body:
        'MUTX stores deployment versions and lifecycle events, and can roll back a control-plane snapshot.',
      points: [
        {
          title: 'Review desired state and history.',
          body: 'The record keeps its configuration, version context, and lifecycle updates together.',
        },
        {
          title: 'Check execution with the provider.',
          body: 'Your integration applies deployment changes and reports the result.',
        },
      ],
    },
    destination: { href: '/dashboard/deployments', label: 'Open deployment records' },
    seo: {
      title: 'AI Agent Deployment Records | MUTX',
      description:
        'Review deployment configuration, versions, lifecycle events, and control-plane snapshot rollback in MUTX.',
      keywords: ['AI agent deployment records', 'agent lifecycle history', 'deployment versions'],
      socialDescription:
        'Track deployment records in MUTX and verify provider execution through its integration.',
      twitterTitle: 'AI Agent Deployment Records | MUTX',
      twitterDescription:
        'Inspect desired state and lifecycle changes, then verify provider execution separately.',
      webPageName: 'AI Agent Deployment Records | MUTX',
      webPageDescription:
        'Deployment configuration, lifecycle events, and control-plane snapshot rollback for operator review.',
    },
  },
  governance: {
    path: '/ai-agent-governance',
    breadcrumbLabel: 'AI Agent Governance',
    hero: {
      eyebrow: 'Permissions',
      title: 'Give tools clear permissions.',
      body:
        'Apply role checks to declared API routes and policy to registered tools.',
      scopeNote:
        'Other execution paths need their own checks.',
    },
    example: {
      category: 'Permission rules',
      subject: 'MUTX request checks',
      state: 'Two entry points',
      fields: [
        { label: 'API routes', value: 'Declared role and ownership checks' },
        { label: 'Runtime tools', value: 'Policy before registered dispatch' },
        { label: 'Other paths', value: 'Connect a separate check' },
      ],
    },
    section: {
      title: 'Check access at two entry points.',
      body:
        'MUTX checks route permissions on the API and tool policy inside its runtime.',
      points: [
        {
          title: 'Declared API routes',
          body: 'Role and ownership checks run where a route declares those requirements.',
        },
        {
          title: 'Registered runtime tools',
          body: 'MUTX policy evaluates a normalized tool call before its handler runs.',
        },
      ],
    },
    destination: { href: '/dashboard/security', label: 'Open security and policy' },
    seo: {
      title: 'AI Agent Permissions and Runtime Policy | MUTX',
      description:
        'See where MUTX checks roles on declared API routes and policy on registered tools handled by its runtime.',
      keywords: ['AI agent permissions', 'runtime tool policy', 'agent API authorization'],
      socialDescription:
        'MUTX checks declared API routes and registered tool calls at their respective entry points.',
      twitterTitle: 'AI Agent Permissions | MUTX',
      twitterDescription:
        'Set access rules for declared API routes and tools dispatched through the MUTX runtime.',
      webPageName: 'AI Agent Permissions | MUTX',
      webPageDescription:
        'Role and ownership checks on declared routes, plus policy evaluation for registered MUTX runtime tools.',
    },
  },
  guardrails: {
    path: '/ai-agent-guardrails',
    breadcrumbLabel: 'AI Agent Guardrails',
    hero: {
      eyebrow: 'Tool checks',
      title: 'Check tool calls before they run.',
      body:
        'MUTX applies policy to registered tool calls before they run.',
      scopeNote:
        'Calls routed outside MUTX do not pass through these checks.',
    },
    example: {
      category: 'Tool request',
      subject: 'documents.share',
      state: 'Stopped before execution',
      fields: [
        { label: 'Destination', value: 'External workspace' },
        { label: 'Policy result', value: 'Deferred' },
        { label: 'Next step', value: 'Integration connects approval to the call' },
      ],
    },
    section: {
      title: 'Registered tools go through policy first.',
      body:
        'MUTX checks a normalized tool call before it reaches the registered handler.',
      points: [
        {
          title: 'Route the tool through MUTX.',
          body: 'The runtime can permit, deny, or defer a registered tool call.',
        },
        {
          title: 'Enable text checks when needed.',
          body: 'SDK middleware checks text only when the application turns it on.',
        },
      ],
    },
    destination: { href: '/dashboard/security', label: 'Open security and policy' },
    seo: {
      title: 'AI Agent Tool Guardrails | MUTX',
      description:
        'Check registered MUTX runtime tools before dispatch, with optional SDK text middleware when the application enables it.',
      keywords: ['AI agent guardrails', 'pre-handler tool checks', 'registered tool policy'],
      socialDescription:
        'MUTX checks registered tools before dispatch and supports optional SDK text middleware.',
      twitterTitle: 'AI Agent Tool Guardrails | MUTX',
      twitterDescription:
        'Apply policy to tools routed through the MUTX runtime before they run.',
      webPageName: 'AI Agent Tool Guardrails | MUTX',
      webPageDescription:
        'Registered tool checks in the MUTX runtime and optional caller-enabled SDK text middleware.',
    },
  },
  infrastructure: {
    path: '/ai-agent-infrastructure',
    breadcrumbLabel: 'AI Agent Infrastructure Records',
    hero: {
      eyebrow: 'Agent state',
      title: 'See agent state in context.',
      body:
        'Review configured agent state beside health and resource information sent by integrations.',
      scopeNote:
        'Provider details appear only when an integration reports them.',
    },
    example: {
      category: 'Agent configuration',
      subject: 'Example worker',
      state: 'Desired state',
      fields: [
        { label: 'Configuration', value: 'Stored in MUTX' },
        { label: 'Health', value: 'Reported by integration' },
        { label: 'Provider details', value: 'Supplied when connected' },
      ],
    },
    section: {
      title: 'Read configuration beside reported state.',
      body:
        'MUTX keeps desired values and reported signals attached to their source.',
      points: [
        {
          title: 'Review agent configuration.',
          body: 'The record shows settings and desired state stored in the control plane.',
        },
        {
          title: 'Add signals through an integration.',
          body: 'A connected system can send health, resource, and provider details for review.',
        },
      ],
    },
    destination: { href: '/dashboard/agents', label: 'Open agent records' },
    seo: {
      title: 'AI Agent State and Reported Infrastructure | MUTX',
      description:
        'Review agent configuration and desired state beside health or resource details sent by connected integrations.',
      keywords: ['AI agent configuration', 'reported agent state', 'agent desired state'],
      socialDescription:
        'See agent configuration beside health and resource details sent by integrations.',
      twitterTitle: 'AI Agent State | MUTX',
      twitterDescription:
        'Keep configured state and reported infrastructure details tied to their source.',
      webPageName: 'AI Agent State and Infrastructure | MUTX',
      webPageDescription:
        'Agent configuration and desired state alongside health, resource, or provider details supplied by integrations.',
    },
  },
  monitoring: {
    path: '/ai-agent-monitoring',
    breadcrumbLabel: 'AI Agent Monitoring',
    hero: {
      eyebrow: 'Run monitoring',
      title: 'Follow the events in each run.',
      body:
        'Read run events and adapter updates sent by connected systems.',
      scopeNote:
        'Run history covers only events those systems report.',
    },
    example: {
      category: 'Run record',
      subject: 'Example research task',
      state: 'Submitted activity',
      fields: [
        { label: 'Run events', value: 'Shown in received order' },
        { label: 'Adapter updates', value: 'Sent by connected system' },
        { label: 'Governed tools', value: 'Recorded by MUTX runtime' },
      ],
    },
    section: {
      title: 'Keep event sources in the record.',
      body:
        'MUTX shows ordered events and adapter callbacks that connected systems send, beside evidence from governed tool calls.',
      points: [
        {
          title: 'Submitted activity',
          body: 'An integration sends the run trace and callbacks it observes.',
        },
        {
          title: 'Governed tool calls',
          body: 'MUTX records policy decisions and observed results for calls routed through its runtime.',
        },
      ],
    },
    destination: { href: '/dashboard/observability', label: 'Open observability' },
    seo: {
      title: 'AI Agent Run Monitoring | MUTX',
      description:
        'Review run events and adapter updates submitted by connected systems beside governed-call evidence from MUTX.',
      keywords: ['AI agent run monitoring', 'submitted run traces', 'agent adapter events'],
      socialDescription:
        'Follow submitted run activity and governed-call evidence with each source in view.',
      twitterTitle: 'AI Agent Run Monitoring | MUTX',
      twitterDescription:
        'Inspect run events and adapter callbacks sent by connected systems.',
      webPageName: 'AI Agent Run Monitoring | MUTX',
      webPageDescription:
        'Monitoring views for submitted run events and evidence from governed MUTX runtime calls.',
    },
  },
  reliability: {
    path: '/ai-agent-reliability',
    breadcrumbLabel: 'AI Agent Health Signals',
    hero: {
      eyebrow: 'Health signals',
      title: 'Know when an agent goes quiet.',
      body:
        'MUTX tracks reported heartbeats, service readiness, stale-state alerts, and webhook delivery issues.',
      scopeNote:
        'MUTX reports signals; your runtime handles recovery actions.',
    },
    example: {
      category: 'Health overview',
      subject: 'Example agent',
      state: 'Reported signals',
      fields: [
        { label: 'Agent', value: 'Heartbeat reported by runtime' },
        { label: 'MUTX service', value: 'API and database readiness' },
        { label: 'Webhooks', value: 'Delivery circuit state' },
      ],
    },
    section: {
      title: 'Read each signal for what it measures.',
      body:
        'An agent heartbeat, MUTX service readiness, and webhook delivery each point to a different part of the system.',
      points: [
        {
          title: 'Agent heartbeat',
          body: 'Reported check-ins update the agent status and stale-state alerts.',
        },
        {
          title: 'MUTX and webhook health',
          body: 'Readiness covers the control plane; its delivery circuit covers webhook failures.',
        },
      ],
    },
    destination: { href: '/dashboard/monitoring', label: 'Open monitoring' },
    seo: {
      title: 'AI Agent Health Signals | MUTX',
      description:
        'Review reported agent heartbeats, stale-state alerts, MUTX API readiness, and webhook delivery circuit state.',
      keywords: ['AI agent health signals', 'agent heartbeat monitoring', 'MUTX readiness'],
      socialDescription:
        'Inspect agent heartbeat, MUTX readiness, and webhook delivery signals in their proper scope.',
      twitterTitle: 'AI Agent Health Signals | MUTX',
      twitterDescription:
        'Use reported heartbeats, service readiness, and delivery state to guide operator review.',
      webPageName: 'AI Agent Health Signals | MUTX',
      webPageDescription:
        'Reported heartbeats, MUTX readiness checks, stale-state alerts, and webhook delivery circuit state.',
    },
  },
} as const satisfies Record<string, OperationalStory>

export function buildOperationalStoryMetadata(story: OperationalStory): Metadata {
  return {
    title: story.seo.title,
    description: story.seo.description,
    keywords: [...story.seo.keywords],
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
        'Source-available operator software for agent records, submitted activity, and governed runtime calls.',
    },
    {
      '@type': 'WebPage',
      name: story.seo.webPageName,
      url: getCanonicalUrl(story.path),
      description: story.seo.webPageDescription,
      isPartOf: { '@type': 'WebSite', name: 'MUTX', url: siteUrl },
    },
    {
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
    },
  ]

  return { '@context': 'https://schema.org', '@graph': graph }
}
