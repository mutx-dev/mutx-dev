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

export type MarketingHomepage = {
  hero: {
    tagline: string
    title: string
    support?: string
    backgroundSrc: string
    backgroundAlt: string
    actions: MarketingActionLink[]
  }
  salesSections: {
    demo: {
      eyebrow: string
      title: string
      body: string
      tabs: Array<{
        id: string
        label: string
        title: string
        body: string
        mediaType: 'image' | 'gif'
        mediaSrc: string
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
    tone: 'primary',
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
  salesSections: {
    demo: {
      eyebrow: 'See MUTX in action',
      title: 'Watch the run, not the aftermath.',
      body: 'One surface for steps, permissions, and the record that survives review.',
      tabs: [
        {
          id: 'runtime',
          label: 'Activity log',
          title: 'Read every step as it lands.',
          body: 'Tool calls, outputs, and state changes stay in one readable timeline.',
          mediaType: 'gif',
          mediaSrc: '/demo.gif',
          mediaAlt: 'MUTX showing agent activity in real time',
        },
        {
          id: 'governance',
          label: 'Permissions',
          title: 'Move the boundary forward.',
          body: 'Approval edges and guardrails stay visible before the action settles.',
          mediaType: 'gif',
          mediaSrc: '/demo.gif',
          mediaAlt: 'MUTX demo showing permission boundaries and approvals',
        },
        {
          id: 'operator',
          label: 'Peace of mind',
          title: 'Keep proof that still reads clean later.',
          body: 'The run history stays inspectable instead of collapsing into guesswork.',
          mediaType: 'gif',
          mediaSrc: '/demo.gif',
          mediaAlt: 'MUTX demo showing readable run history and audit trails',
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
      actions: homepageActions,
    },
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
  title: 'YOUR AI AGENTS, UNDER CONTROL.',
  body: 'Start with the Mac app and inspect one real run.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
