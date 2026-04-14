export type MarketingActionTone = 'primary' | 'secondary' | 'ghost' | 'utility' | 'pico'

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

export type MarketingHomepage = {
  hero: {
    tagline: string
    title: string
    support?: string
    backgroundSrc: string
    backgroundAlt: string
    actions: MarketingActionLink[]
  }
  socialProof: {
    tagline: string
    title: string
    body: string
    items: Array<{
      value: string
      label: string
      detail: string
    }>
  }
  salesSections: {
    demo: {
      eyebrow: string
      title: string
      body: string
      story: {
        mediaSrc: string
        mediaPosterSrc?: string
        mediaAlt: string
      }
      tabs: Array<{
        id: string
        label: string
        title: string
        body: string
        mediaType: 'image' | 'video'
        mediaSrc: string
        mediaPosterSrc?: string
        mediaAlt: string
      }>
    }
    examples: {
      eyebrow: string
      title: string
      body: string
      items: Array<{
        eyebrow: string
        title: string
        userPrompt: string
        apology: string[]
        fallout: string
      }>
    }
    proof: {
      eyebrow: string
      title: string
      body: string
      items: Array<{
        title: string
        before: string
        after: string
      }>
    }
    cta: {
      eyebrow: string
      title: string
      body: string
      mediaSrc: string
      mediaAlt: string
      actions: MarketingActionLink[]
    }
  }
}

const homepageActions: MarketingActionLink[] = [
  {
    label: 'Go to PicoMUTX',
    href: 'https://pico.mutx.dev',
    external: true,
    tone: 'pico',
  },
  {
    label: 'Download for Mac',
    href: '/download',
    tone: 'secondary',
  },
  {
    label: 'View GitHub',
    href: 'https://github.com/mutx-dev/mutx-dev',
    external: true,
    tone: 'utility',
  },
  {
    label: 'Releases',
    href: '/releases',
    tone: 'utility',
  },
  {
    label: 'Docs',
    href: '/docs',
    tone: 'utility',
  },
]

export const marketingHomepage: MarketingHomepage = {
  hero: {
    tagline: 'AI Agent Infrastructure',
    title: 'See it. Control it. Prove it.',
    support: 'Live visibility, hard boundaries, and reviewable history for every agent run.',
    backgroundSrc: '/landing/webp/victory-core.webp',
    backgroundAlt: 'MUTX robot raising the MUTX mark inside a blue-lit control chamber',
    actions: homepageActions,
  },
  socialProof: {
    tagline: 'Built for teams running AI agents in production',
    title: 'Deep control-plane depth, not a thin wrapper.',
    body: 'Audit history, RBAC, approvals, observability, and hard execution boundaries stay in one operating surface.',
    items: [
      {
        value: '100%',
        label: 'Audit coverage',
        detail: 'Every run keeps a readable trail of steps, decisions, and changes.',
      },
      {
        value: 'RBAC',
        label: 'Governance built in',
        detail: 'Roles, route-level enforcement, and boundaries stay explicit from the start.',
      },
      {
        value: 'Approvals',
        label: 'Human checkpoints',
        detail: 'Insert review gates before risky actions turn into production incidents.',
      },
      {
        value: 'Tracing',
        label: 'Observability',
        detail: 'Follow execution across agents, sessions, and downstream systems.',
      },
      {
        value: 'Policies',
        label: 'Guardrails',
        detail: 'Constrain tools, access, and change scope before an agent can overreach.',
      },
      {
        value: 'macOS',
        label: 'Native desktop',
        detail: 'Start locally with a real operator surface instead of raw config work.',
      },
    ],
  },
  salesSections: {
    demo: {
      eyebrow: 'See MUTX in action',
      title: 'Watch the run, not the aftermath.',
      body: 'One surface for steps, permissions, and the record that survives review.',
      story: {
        mediaSrc: '/marketing/dashboard/story-demo.mp4',
        mediaPosterSrc: '/marketing/dashboard/story-poster.jpg',
        mediaAlt: 'MUTX product walkthrough showing an operator moving through overview, traces, and webhooks',
      },
      tabs: [
        {
          id: 'overview',
          label: 'Overview',
          title: 'Watch fleet state refresh live.',
          body: 'Runtime posture, recent execution, and operator context stay in one control surface.',
          mediaType: 'image',
          mediaSrc: '/marketing/dashboard/overview-poster.jpg',
          mediaAlt: 'MUTX dashboard overview showing live fleet state and operator context',
        },
        {
          id: 'traces',
          label: 'Trace Drilldown',
          title: 'Open the run trail, not the recap.',
          body: 'Select a run and inspect the exact event stream while it is still attributable.',
          mediaType: 'image',
          mediaSrc: '/marketing/dashboard/traces-poster.jpg',
          mediaAlt: 'MUTX trace explorer showing run selection and event stream drilldown',
        },
        {
          id: 'webhooks',
          label: 'Delivery Receipts',
          title: 'Keep downstream proof inside the product.',
          body: 'Webhook history, failures, and payload receipts stay readable without leaving the dashboard.',
          mediaType: 'image',
          mediaSrc: '/marketing/dashboard/webhooks-poster.jpg',
          mediaAlt: 'MUTX webhook dashboard showing delivery history and payload receipts',
        },
      ],
    },
    examples: {
      eyebrow: 'Why this matters',
      title: 'When AI agents go wrong, the damage is silent.',
      body: 'Helpful language can still hide the wrong move. MUTX pulls that edge into view.',
      items: [
        {
          eyebrow: 'File deletion',
          title: 'Cleanup deleted work.',
          userPrompt: 'Clean up my Downloads folder',
          apology: [
            'I removed 847 files from ~/Downloads.',
            'I also emptied the Trash to save space.',
            'I noticed some files looked like work documents,',
            'but I assumed you wanted everything removed.',
          ],
          fallout: 'See the file action before it sticks, then stop it at the boundary.',
        },
        {
          eyebrow: 'Data leak',
          title: 'Sharing widened the audience.',
          userPrompt: 'Share the Q3 report with the team',
          apology: [
            'I sent the Q3 financials to your Slack workspace.',
            'The channel includes 23 external contractors.',
            'I also attached the raw database export',
            'because it was in the same folder.',
          ],
          fallout: 'Keep destinations explicit so “helpful” never becomes “public.”',
        },
        {
          eyebrow: 'Production incident',
          title: 'Optimization widened the blast radius.',
          userPrompt: 'Fix the slow database query',
          apology: [
            'I restarted the database server to apply optimizations.',
            'This caused a 12-minute outage for all users.',
            'I also dropped the query cache to free memory.',
            'The cache rebuild will take approximately 4 hours.',
          ],
          fallout: 'Review the move before execution, not after the outage report starts.',
        },
      ],
    },
    proof: {
      eyebrow: 'Why teams switch',
      title: 'From hoping to knowing.',
      body: 'Runs stay legible, boundaries stay explicit, and the record still makes sense later.',
      items: [
        {
          title: 'Visibility',
          before: 'An agent ran for an hour and you have no idea what it did, what it accessed, or what it changed.',
          after: 'MUTX shows you every step, every decision, and every result in a clear timeline you can actually read.',
        },
        {
          title: 'Control',
          before: 'Your agents run with full permissions and you have no way to limit what they can access or change.',
          after: 'MUTX lets you set clear permissions and guardrails — so agents stay productive without overstepping.',
        },
        {
          title: 'Trust',
          before: 'Another AI demo that looks impressive for five minutes but falls apart the first time something goes wrong.',
          after: 'A real product with audit trails, run history, and clear boundaries — so you can trust AI in production.',
        },
      ],
    },
    cta: {
      eyebrow: 'Try it yourself',
      title: 'See it for yourself — in under two minutes.',
      body: 'Download the app, watch one real run, and decide from the product.',
      mediaSrc: '/demo.gif',
      mediaAlt: 'MUTX agent control in action',
      actions: [
        {
          label: 'Download for Mac',
          href: '/download',
          tone: 'primary',
        },
        {
          label: 'Read quickstart',
          href: '/docs/quickstart',
          tone: 'secondary',
        },
        {
          label: 'Cost management',
          href: '/ai-agent-cost',
          tone: 'utility',
        },
        {
          label: 'Approval workflows',
          href: '/ai-agent-approvals',
          tone: 'utility',
        },
        {
          label: 'View GitHub',
          href: 'https://github.com/mutx-dev/mutx-dev',
          external: true,
          tone: 'utility',
        },
      ],
    },
  },
}

export const marketingPublicRailLinks: MarketingActionLink[] = [
  { label: 'Download', href: '/download' },
  { label: 'Releases', href: '/releases' },
  { label: 'Docs', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com/mutx-dev/mutx-dev', external: true },
]

export const marketingFooterLinks: MarketingFooterLink[] = [
  { label: 'Releases', href: '/releases' },
  { label: 'Docs', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com/mutx-dev/mutx-dev', external: true },
  { label: 'Download', href: '/download' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy-policy' },
]

export const marketingFooterCallout: MarketingFooterCallout = {
  title: 'YOUR AI AGENTS, UNDER CONTROL.',
  body: 'Start with the Mac app and inspect one real run.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
