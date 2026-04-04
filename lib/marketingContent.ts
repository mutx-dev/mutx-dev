export type MarketingActionTone = 'primary' | 'secondary' | 'ghost' | 'utility'

export type MarketingActionLink = {
  label: string
  href: string
  external?: boolean
  tone?: MarketingActionTone
}

export type MarketingFooterLink = {
  label: string
  href: string
  external?: boolean
}

export type MarketingFooterCallout = {
  title: string
  body: string
  action: MarketingActionLink
}

export type MarketingAgentIcon =
  | 'shield'
  | 'workflow'
  | 'plug'
  | 'siren'
  | 'database'
  | 'terminal'
  | 'search'
  | 'accessibility'

export type MarketingHomepage = {
  hero: {
    tagline: string
    title: string
    support: string
    backgroundSrc: string
    backgroundAlt: string
    actions: MarketingActionLink[]
  }
  featureGrid: {
    eyebrow: string
    title: string
    body: string
    stats: Array<{
      value: string
      label: string
    }>
    cards: Array<{
      eyebrow: string
      title: string
      body: string
    }>
  }
  agentShowcase: {
    eyebrow: string
    title: string
    body: string
    marquee: string[]
    featured: {
      name: string
      slug: string
      icon: MarketingAgentIcon
      label: string
      summary: string
      quote: string
      capabilities: string[]
    }
    cards: Array<{
      name: string
      slug: string
      icon: MarketingAgentIcon
      summary: string
    }>
  }
  operatorSection: {
    eyebrow: string
    title: string
    body: string
    preview: {
      eyebrow: string
      title: string
      body: string
      imageSrc: string
      imageAlt: string
      items: string[]
    }
    pillars: Array<{
      id: string
      index: string
      title: string
      body: string
    }>
  }
  finalCta: {
    eyebrow: string
    title: string
    body: string
    actions: MarketingActionLink[]
  }
}

const homepageActions: MarketingActionLink[] = [
  {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
  {
    label: 'Releases',
    href: '/releases',
    tone: 'secondary',
  },
  {
    label: 'Docs',
    href: 'https://docs.mutx.dev',
    external: true,
    tone: 'ghost',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/mutx-dev/mutx-dev',
    external: true,
    tone: 'utility',
  },
]

const showcasedAgents = [
  {
    name: 'Security Engineer',
    slug: 'security-engineer',
    icon: 'shield' as const,
    summary: 'Models threats, reviews code, and designs security architecture that actually holds.',
  },
  {
    name: 'Workflow Architect',
    slug: 'workflow-architect',
    icon: 'workflow' as const,
    summary: 'Maps every critical path before implementation so automation does not drift into theater.',
  },
  {
    name: 'MCP Builder',
    slug: 'mcp-builder',
    icon: 'plug' as const,
    summary: 'Builds the tool interfaces that make agents useful against real systems and live infrastructure.',
  },
  {
    name: 'Incident Response Commander',
    slug: 'incident-response-commander',
    icon: 'siren' as const,
    summary: 'Turns production chaos into structured resolution with clear escalation and runtime evidence.',
  },
  {
    name: 'Database Optimizer',
    slug: 'database-optimizer',
    icon: 'database' as const,
    summary: 'Tightens indexes, query paths, and schemas before your database decides to ruin the weekend.',
  },
  {
    name: 'Terminal Integration Specialist',
    slug: 'terminal-integration-specialist',
    icon: 'terminal' as const,
    summary: 'Owns the low-level terminal layer where text rendering, emulation, and operator UX converge.',
  },
  {
    name: 'LSP / Index Engineer',
    slug: 'lsp-index-engineer',
    icon: 'search' as const,
    summary: 'Builds code intelligence through indexing, orchestration, and search that developers can actually trust.',
  },
  {
    name: 'Accessibility Auditor',
    slug: 'accessibility-auditor',
    icon: 'accessibility' as const,
    summary: 'Stress-tests interfaces with the standards and assistive realities most teams still pretend are edge cases.',
  },
]

export const marketingHomepage: MarketingHomepage = {
  hero: {
    tagline: 'Signed. Notarized. Shipping now.',
    title: 'Deploy. Govern. Share.',
    support: 'The open control plane for specialist agents operating on real systems.',
    backgroundSrc: '/landing/webp/victory-core.webp',
    backgroundAlt: 'MUTX robot raising the MUTX mark inside a blue-lit control chamber',
    actions: homepageActions,
  },
  featureGrid: {
    eyebrow: 'Production layer',
    title: 'A serious stack for serious agents.',
    body: 'Not one generalist chatbot. A fleet of operators, each with a job, each shipping through one governed surface.',
    stats: [
      { value: '8', label: 'specialist agents shown below' },
      { value: '1', label: 'control plane for deploy, policy, and runtime' },
      { value: '0', label: 'tolerance for prompt-soup ops' },
    ],
    cards: [
      {
        eyebrow: 'Identity',
        title: 'Every actor has a shape.',
        body: 'Humans, agents, tools, and triggers stay explicit so operators know exactly who touched what.',
      },
      {
        eyebrow: 'Boundaries',
        title: 'Capabilities stay outside the prompt.',
        body: 'Secrets, tools, and policies live in the control layer instead of getting smeared into instructions.',
      },
      {
        eyebrow: 'Observability',
        title: 'Runs come with receipts.',
        body: 'Inspect prompts, tool calls, outcomes, and release paths without reverse-engineering the mess later.',
      },
      {
        eyebrow: 'Release lane',
        title: 'From local proof to governed rollout.',
        body: 'The same surface that deploys the agent is the one that keeps docs, notes, and source aligned.',
      },
    ],
  },
  agentShowcase: {
    eyebrow: 'Specialist fleet',
    title: 'A stack of agents with actual jobs.',
    body: 'Pulled from the agency roster. Different disciplines. Different iconography. Same governed runtime.',
    marquee: showcasedAgents.map((agent) => agent.name),
    featured: {
      name: 'Incident Response Commander',
      slug: 'incident-response-commander',
      icon: 'siren',
      label: 'Flagship specialist',
      summary: 'The kind of agent you only trust when the operating surface, runtime evidence, and escalation path all look bulletproof.',
      quote: 'When prod catches fire, the last thing you want is a toy agent.',
      capabilities: [
        'Owns escalation with runtime receipts.',
        'Coordinates humans, tools, and decisions.',
        'Turns chaos into a governed sequence.',
      ],
    },
    cards: showcasedAgents,
  },
  operatorSection: {
    eyebrow: 'Operator view',
    title: 'The runtime surface looks expensive because it should.',
    body: 'If the product governs deployed agents, the page should feel like precision hardware, not a Notion doc with gradients.',
    preview: {
      eyebrow: 'Control surface',
      title: 'One lane for deployment, governance, and runtime review.',
      body: 'The visual system stays tight because the operating model stays tight.',
      imageSrc: '/landing/webp/docs-surface.webp',
      imageAlt: 'MUTX control surface showing a docs and runtime panel',
      items: [
        'Policy, identity, and tools stay explicit.',
        'Specialist agents run with reviewable context.',
        'Release artifacts and docs stay in sync.',
      ],
    },
    pillars: [
      {
        id: 'deploy-with-boundaries',
        index: '01',
        title: 'Deploy with hard boundaries.',
        body: 'Separate the agent from the keys, tools, and policy it depends on so operators keep control.',
      },
      {
        id: 'govern-the-runtime',
        index: '02',
        title: 'Govern what happens at runtime.',
        body: 'Track the exact run surface: who invoked it, what it called, what changed, and where it should stop next time.',
      },
      {
        id: 'share-the-right-surface',
        index: '03',
        title: 'Share capability without losing trust.',
        body: 'Expose the useful specialist while preserving the controls that made it safe to deploy in the first place.',
      },
    ],
  },
  finalCta: {
    eyebrow: 'Start here',
    title: 'Install the Mac app.',
    body: 'Open the signed build, load the stack, and ship from a surface that finally looks like it belongs in production.',
    actions: homepageActions,
  },
}

export const marketingPublicRailLinks: MarketingActionLink[] = [
  { label: 'Download', href: '/download' },
  { label: 'Releases', href: '/releases' },
  { label: 'Docs', href: 'https://docs.mutx.dev', external: true },
  { label: 'GitHub', href: 'https://github.com/mutx-dev/mutx-dev', external: true },
]

export const marketingFooterLinks: MarketingFooterLink[] = [
  { label: 'Releases', href: '/releases' },
  { label: 'Docs', href: 'https://docs.mutx.dev', external: true },
  { label: 'GitHub', href: 'https://github.com/mutx-dev/mutx-dev', external: true },
  { label: 'Download', href: '/download' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy-policy' },
]

export const marketingFooterCallout: MarketingFooterCallout = {
  title: 'SOURCE-AVAILABLE CONTROL FOR AGENTS.',
  body: 'Start with the Mac app. Keep docs, notes, and source aligned.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
