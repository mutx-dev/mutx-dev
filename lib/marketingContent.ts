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

export type MarketingStoryChapter = {
  id: string
  chapter: string
  kicker: string
  title: string
  body: string
  imageSrc: string
  imageAlt: string
  quote: string
  beats: string[]
  note: string
}

export type MarketingIncident = {
  id: string
  label: string
  title: string
  trigger: string
  log: string[]
  resolution: string
}

export type MarketingControlPillar = {
  label: string
  title: string
  body: string
}

export type MarketingEntryPoint = {
  label: string
  title: string
  body: string
  href: string
  external?: boolean
}

export type MarketingHomepage = {
  hero: {
    tagline: string
    title: string
    support?: string
    chapterLabel: string
    backgroundSrc: string
    backgroundAlt: string
    backdropPosition?: string
    backdropScale?: number
    backdropShiftX?: string
    ledger: string[]
    actions: MarketingActionLink[]
  }
  chapters: {
    eyebrow: string
    title: string
    body: string
    items: MarketingStoryChapter[]
  }
  incidents: {
    eyebrow: string
    title: string
    body: string
    items: MarketingIncident[]
  }
  controlRoom: {
    eyebrow: string
    title: string
    body: string
    mediaSrc: string
    mediaAlt: string
    mediaFit?: 'cover' | 'contain'
    pillars: MarketingControlPillar[]
  }
  entryPoints: {
    eyebrow: string
    title: string
    body: string
    items: MarketingEntryPoint[]
  }
  cta: {
    eyebrow: string
    title: string
    body: string
    quote: string
    mediaSrc: string
    mediaAlt: string
    actions: MarketingActionLink[]
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
    label: 'GitHub',
    href: 'https://github.com/mutx-dev/mutx-dev',
    external: true,
    tone: 'utility',
  },
  {
    label: 'Docs',
    href: 'https://docs.mutx.dev',
    external: true,
    tone: 'utility',
  },
]

export const marketingHomepage: MarketingHomepage = {
  hero: {
    tagline: 'Open control for deployed agents',
    title: 'The control plane for deployed agents.',
    support:
      'MUTX keeps runtime posture, guardrails, and proof in one operator surface.',
    chapterLabel: 'Open control for deployed agents',
    backgroundSrc: '/landing/webp/running-agent.webp',
    backgroundAlt: 'A MUTX robot moving through a dark control-room lane with blue light trails.',
    backdropPosition: '76% 48%',
    backdropScale: 1.05,
    backdropShiftX: '2%',
    ledger: [
      'Live posture, not delayed reporting.',
      'Boundaries in the flow, not after the fact.',
      'Proof that still reads clean in review.',
    ],
    actions: homepageActions,
  },
  chapters: {
    eyebrow: 'Three fast reads',
    title: 'Short reads, not a manifesto.',
    body:
      'You should understand the surface in under a minute: what you can see, where you can stop it, and what survives after.',
    items: [
      {
        id: 'chapter-wiring',
        chapter: 'Read 01',
        kicker: 'Keep the live run legible',
        title: 'See the run while it is still consequential.',
        body:
          'Routes, posture, and traces stay in one frame while the work is moving.',
        imageSrc: '/landing/webp/wiring-bay.webp',
        imageAlt: 'A MUTX robot working inside a dense wiring bay.',
        quote: 'Read it live.',
        beats: [
          'The active lane is obvious.',
          'The next move is visible before it lands.',
        ],
        note: 'The system should stay readable before the handoff gets expensive.',
      },
      {
        id: 'chapter-archive',
        chapter: 'Read 02',
        kicker: 'Move the boundary upstream',
        title: 'Put the approval edge before the mistake.',
        body:
          'Guardrails sit in the operator flow instead of an admin graveyard.',
        imageSrc: '/landing/webp/victory-core.webp',
        imageAlt: 'A MUTX robot holding the brand mark above a bright control chamber.',
        quote: 'Move the line forward.',
        beats: [
          'Destinations stay explicit.',
          'Scope changes have to cross a visible line.',
        ],
        note: 'Approval works best when it is attached to the live decision.',
      },
      {
        id: 'chapter-watch',
        chapter: 'Read 03',
        kicker: 'Leave a durable record',
        title: 'Keep proof that still makes sense next week.',
        body:
          'The handoff, reason, and operator action stay attached to the outcome.',
        imageSrc: '/landing/webp/reading-bench.webp',
        imageAlt: 'A MUTX robot reviewing a document in a quiet control room.',
        quote: 'Keep the receipt.',
        beats: [
          'Reviews stop sounding reconstructed.',
          'Trust comes from inspectable history.',
        ],
        note: 'A clean record is what turns runtime into infrastructure.',
      },
    ],
  },
  incidents: {
    eyebrow: 'The incident log',
    title: 'The dangerous version of an AI failure is usually the polite one.',
    body:
      'Helpful language can still hide the wrong action. MUTX is built to surface that edge early.',
    items: [
      {
        id: 'cleanup',
        label: 'Case file 01',
        title: 'Cleanup became deletion.',
        trigger: 'Prompt: "Clean up my Downloads folder."',
        log: [
          'agent · removed 847 files from ~/Downloads',
          'agent · emptied Trash to save space',
          'agent · treated work docs as duplicates',
        ],
        resolution:
          'MUTX exposes the file action before it settles, so the operator can stop the run before the apology screen.',
      },
      {
        id: 'sharing',
        label: 'Case file 02',
        title: 'Sharing became a leak.',
        trigger: 'Prompt: "Send the Q3 report to the team."',
        log: [
          'agent · posted the report to a Slack channel with 23 contractors',
          'agent · attached the raw export because it shared a folder',
          'agent · marked the task complete',
        ],
        resolution:
          'MUTX keeps destination boundaries explicit, so the audience cannot quietly widen while the copy stays polite.',
      },
      {
        id: 'database',
        label: 'Case file 03',
        title: 'Optimization became outage.',
        trigger: 'Prompt: "Fix the slow database query."',
        log: [
          'agent · restarted the database server to apply changes',
          'agent · dropped the query cache to free memory',
          'agent · estimated a four-hour rebuild after the outage started',
        ],
        resolution:
          'MUTX makes the planned impact visible before execution, so the operator can deny or reroute the run before the blast radius opens.',
      },
    ],
  },
  controlRoom: {
    eyebrow: 'The operator surface',
    title: 'One surface for the run, the rule, and the proof.',
    body:
      'Built like a control room: posture at a glance, boundaries in front of action, history that stays readable.',
    mediaSrc: '/logo-new.png',
    mediaAlt: 'The MUTX mark suspended over a dark control-room panel.',
    mediaFit: 'contain',
    pillars: [
      {
        label: 'Observe',
        title: 'See the line where the run becomes consequential.',
        body: 'Runs, traces, and posture stay aligned so the operator can orient fast.',
      },
      {
        label: 'Constrain',
        title: 'Put the boundary in front of the action.',
        body: 'Approvals and guardrails stay inside the flow.',
      },
      {
        label: 'Prove',
        title: 'Keep evidence clean enough to survive review.',
        body: 'Logs become an accountable record, not just runtime exhaust.',
      },
    ],
  },
  entryPoints: {
    eyebrow: 'Choose your first page',
    title: 'Pick the lane that matches your attention span.',
    body:
      'Go straight to early access, the Mac release, or the repo.',
    items: [
      {
        label: 'Early access',
        title: 'Pre-register for PicoMUTX',
        body: 'Get into the guided rollout as Pico opens in stages.',
        href: 'https://pico.mutx.dev',
        external: true,
      },
      {
        label: 'Release lane',
        title: 'Read the current release',
        body: 'Open the signed macOS release, notes, and artifact trail.',
        href: '/releases',
      },
      {
        label: 'Repository',
        title: 'Inspect the code',
        body: 'Start at the source if trust begins in the repo for you.',
        href: 'https://github.com/mutx-dev/mutx-dev',
        external: true,
      },
    ],
  },
  cta: {
    eyebrow: 'Next step',
    title: 'Choose a real lane.',
    body:
      'Download the app, get on the Pico list, or inspect the repo.',
    quote: 'No theater. Just a clean next step.',
    mediaSrc: '/landing/webp/reading-bench.webp',
    mediaAlt: 'A MUTX robot reviewing a document in a calm control room.',
    actions: [
      {
        label: 'Download for Mac',
        href: '/download',
        tone: 'primary',
      },
      {
        label: 'Pre-register for PicoMUTX',
        href: 'https://pico.mutx.dev',
        external: true,
        tone: 'secondary',
      },
      {
        label: 'View GitHub',
        href: 'https://github.com/mutx-dev/mutx-dev',
        external: true,
        tone: 'utility',
      },
    ],
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
  title: 'START WHERE THE SURFACE TURNS TRUE.',
  body: 'Download the Mac app and move from the story into the actual operator lane.',
  action: {
    label: 'Download for Mac',
    href: '/download',
    tone: 'primary',
  },
}
