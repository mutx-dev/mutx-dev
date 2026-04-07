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
    tagline: 'Signed. Notarized. Shipping now.',
    title: 'Deploy. Govern. Share.',

    backgroundSrc: '/landing/webp/victory-core.webp',
    backgroundAlt: 'MUTX robot raising the MUTX mark inside a blue-lit control chamber',
    actions: homepageActions,
  },
  salesSections: {
    demo: {
      eyebrow: 'See MUTX in motion',
      title: 'Watch the product before we ask you to believe the copy.',
      body: 'MUTX is easiest to understand when you see the runtime, governance, and release path on screen. Start with the real surfaces.',
      tabs: [
        {
          id: 'runtime',
          label: 'Runtime',
          title: 'Inspect what the agent actually did.',
          body: 'See the runtime surface where runs, tool calls, and outcomes stay visible instead of disappearing into prompt soup.',
          mediaType: 'gif',
          mediaSrc: '/demo.gif',
          mediaAlt: 'MUTX operator demo showing the runtime in motion',
        },
        {
          id: 'governance',
          label: 'Governance',
          title: 'Keep boundaries explicit.',
          body: 'Put access, policies, and operator decisions in the control layer where teams can review and enforce them.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/docs-surface.webp',
          mediaAlt: 'MUTX control surface showing runtime and governance views',
        },
        {
          id: 'layers',
          label: 'Layers',
          title: 'Deploy without rebuilding the path.',
          body: 'Move from local proof to a governed runtime through the same product surface instead of stitching together one-off tools.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/wiring-bay.webp',
          mediaAlt: 'MUTX runtime wiring bay illustration',
        },
        {
          id: 'operator',
          label: 'Operator lane',
          title: 'Keep the release path readable.',
          body: 'The same product surface that shows the run is the one that helps operators understand what ships next.',
          mediaType: 'image',
          mediaSrc: '/landing/webp/running-agent.webp',
          mediaAlt: 'MUTX running agent artwork inside the product world',
        },
      ],
    },
    proof: {
      eyebrow: 'Why teams switch',
      title: 'From agent theater to deployable systems.',
      body: 'Most teams do not need more agent hype. They need a product that makes deployed agents legible, governable, and shareable.',
      items: [
        {
          title: 'Before MUTX',
          before: 'Agents live inside one-off prompts, hidden scripts, and toolchains nobody wants to audit.',
          after: 'MUTX gives you a visible operator surface for deployment, runtime inspection, and control.',
        },
        {
          title: 'Without control',
          before: 'Teams cannot tell which tool was called, what changed, or how to safely hand the workflow to someone else.',
          after: 'MUTX keeps boundaries, receipts, and sharing paths explicit enough for real teams to use in production.',
        },
        {
          title: 'What buyers get',
          before: 'Another demo that looks clever for five minutes.',
          after: 'A signed product, concrete runtime surfaces, and a release lane that feels like software you can actually operate.',
        },
      ],
    },
    cta: {
      eyebrow: 'Try the product',
      title: 'Install the Mac app and start with the real thing.',
      body: 'Open the signed build, watch the runtime, and decide from the product itself — not from a landing page trying too hard.',
      mediaSrc: '/demo.gif',
      mediaAlt: 'MUTX operator demo showing the control plane in motion',
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
  title: 'SOURCE-AVAILABLE CONTROL FOR AGENTS.',
  body: 'Start with the Mac app. Keep docs, notes, and source aligned.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
