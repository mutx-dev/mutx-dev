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

export const marketingHomepage: MarketingHomepage = {
  hero: {
    tagline: 'Your AI agents are already working. Do you know what they\'re doing?',
    title: 'See it. Control it. Share it with your team.',
    backgroundSrc: '/landing/webp/victory-core.webp',
    backgroundAlt: 'MUTX robot raising the MUTX mark inside a blue-lit control chamber',
    actions: homepageActions,
  },
  salesSections: {
    demo: {
      eyebrow: 'See MUTX in action',
      title: 'Watch what happens when you can actually see your agents work.',
      body: 'MUTX gives you a clear view of every run, every decision, and every outcome. No more guessing.',
      tabs: [
        {
          id: 'runtime',
          label: 'Activity log',
          title: 'Know exactly what your agent did.',
          body: 'Every step, every tool call, every result — all in one place. No more digging through chat logs.',
          mediaType: 'gif',
          mediaSrc: '/demo.gif',
          mediaAlt: 'MUTX showing agent activity in real time',
        },
        {
          id: 'governance',
          label: 'Permissions',
          title: 'Decide what your agents can and cannot do.',
          body: 'Set clear boundaries so agents stay productive without overstepping. Your rules, enforced automatically.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/docs-surface.webp',
          mediaAlt: 'MUTX permission settings for AI agents',
        },
        {
          id: 'layers',
          label: 'Team sharing',
          title: 'Share agents across your team, safely.',
          body: 'Your team gets the same visibility and control — no more copy-pasting prompts in Slack.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/wiring-bay.webp',
          mediaAlt: 'MUTX team sharing interface',
        },
        {
          id: 'operator',
          label: 'Peace of mind',
          title: 'Sleep well knowing your agents are working as intended.',
          body: 'Audit trails, run history, and clear logs mean you always know what happened and why.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/running-agent.webp',
          mediaAlt: 'MUTX agent run history and audit trail',
        },
      ],
    },
    examples: {
      eyebrow: 'Why this matters',
      title: 'When AI agents go wrong, the damage is silent.',
      body: 'Without oversight, a helpful agent can cause real harm. MUTX makes sure you catch it before it spreads.',
      items: [
        {
          eyebrow: 'File deletion',
          title: 'Agent deleted important files',
          userPrompt: 'Clean up my Downloads folder',
          apology: [
            'I removed 847 files from ~/Downloads.',
            'I also emptied the Trash to save space.',
            'I noticed some files looked like work documents,',
            'but I assumed you wanted everything removed.',
          ],
          fallout: 'With MUTX, you see every file action before it sticks. Set a boundary once, protect every run.',
        },
        {
          eyebrow: 'Data leak',
          title: 'Agent sent data to the wrong person',
          userPrompt: 'Share the Q3 report with the team',
          apology: [
            'I sent the Q3 financials to your Slack workspace.',
            'The channel includes 23 external contractors.',
            'I also attached the raw database export',
            'because it was in the same folder.',
          ],
          fallout: 'MUTX keeps sharing boundaries explicit. Agents only reach who you approve, nothing more.',
        },
        {
          eyebrow: 'Production incident',
          title: 'Agent made an outage worse',
          userPrompt: 'Fix the slow database query',
          apology: [
            'I restarted the database server to apply optimizations.',
            'This caused a 12-minute outage for all users.',
            'I also dropped the query cache to free memory.',
            'The cache rebuild will take approximately 4 hours.',
          ],
          fallout: 'MUTX shows you what the agent plans to do. Review, approve, or stop it — before the damage hits.',
        },
      ],
    },
    proof: {
      eyebrow: 'Why teams switch',
      title: 'From "I hope it works" to "I know it works."',
      body: 'Most teams are flying blind with AI agents. MUTX gives you the visibility and control you need to use AI confidently.',
      items: [
        {
          title: 'Visibility',
          before: 'An agent ran for an hour and you have no idea what it did, what it accessed, or what it changed.',
          after: 'MUTX shows you every step, every decision, and every result in a clear timeline you can actually read.',
        },
        {
          title: 'Control',
          before: 'You share agent access by copying prompts into Slack and hoping nobody tweaks them in a bad way.',
          after: 'MUTX lets you set clear permissions and share agents with your team through a proper, auditable workspace.',
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
      body: 'Download the Mac app, watch your first agent run, and decide from the product. No signup required.',
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
  body: 'Start with the Mac app. See what your agents are really doing.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
