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
    label: 'View GitHub',
    href: 'https://github.com/mutx-dev/mutx-dev',
    external: true,
    tone: 'secondary',
  },
  {
    label: 'Releases',
    href: '/releases',
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
    tagline: 'A field novel for deployed agents',
    title: 'Most agent failures do not announce themselves.',
    support:
      'They look like a helpful run, a tidy summary, a quiet deletion, or a decision nobody noticed in time. MUTX turns that invisible stretch of work into a readable system.',
    chapterLabel: 'Prologue · The invisible shift',
    backgroundSrc: '/landing/webp/victory-core.webp',
    backgroundAlt: 'MUTX robot raising the MUTX mark inside a blue-lit control chamber',
    ledger: [
      'Watch each run become legible.',
      'Set the boundary before the agent improvises.',
      'Keep proof after the incident is over.',
    ],
    actions: homepageActions,
  },
  chapters: {
    eyebrow: 'Three chapters from the control room',
    title: 'Read the system the way an operator does: as scenes, not slogans.',
    body:
      'Each chapter starts with a believable moment. Then the surface shows the evidence, the constraint, and the reason the next decision can be trusted.',
    items: [
      {
        id: 'chapter-wiring',
        chapter: 'Chapter 01',
        kicker: 'The room before the action',
        title: 'Before the incident, there is always a wiring diagram nobody can quite see.',
        body:
          'MUTX keeps the shape of the runtime visible while the work is happening. You know which lane is active, which boundary is armed, and where the run can still be stopped.',
        imageSrc: '/landing/webp/wiring-bay.webp',
        imageAlt: 'A warm-toned control wall with illuminated wiring and status strips.',
        quote: 'Legibility is not a report. It is a live condition.',
        beats: [
          'Runs stay readable while they execute, not only after they finish.',
          'Approvals, traces, and operator context remain in one line of sight.',
          'The system feels supervised instead of merely logged.',
        ],
        note: 'This is the moment the operator decides whether to let the sequence continue.',
      },
      {
        id: 'chapter-archive',
        chapter: 'Chapter 02',
        kicker: 'What survives the decision',
        title: 'A useful audit trail reads like an archive, not like rubble.',
        body:
          'The point is not to collect more text. The point is to keep the decisive lines, the policy edge, and the exact handoff that changed the outcome.',
        imageSrc: '/landing/webp/docs-surface.webp',
        imageAlt: 'MUTX document and policy views arranged as a calm operator archive.',
        quote: 'Proof should still make sense two weeks after the urgency is gone.',
        beats: [
          'Every action can be traced back to a moment, a reason, and a human boundary.',
          'Post-incident reviews stop sounding like guesswork.',
          'Teams can show what happened without reconstructing the whole week.',
        ],
        note: 'The archive is where trust stops being rhetorical and starts being inspectable.',
      },
      {
        id: 'chapter-watch',
        chapter: 'Chapter 03',
        kicker: 'How trust is earned',
        title: 'Confidence comes from seeing the run widen without losing its outline.',
        body:
          'When the surface stays calm under load, operators stop treating the agent as a magic trick and start treating it like production software with a readable posture.',
        imageSrc: '/landing/webp/running-agent.webp',
        imageAlt: 'A running agent timeline with status markers and clear operational posture.',
        quote: 'Trust is the byproduct of a system that remains explainable under stress.',
        beats: [
          'The operator can widen from one run to the larger pattern without switching mental models.',
          'The product keeps consequences and context in the same frame.',
          'Scaling up feels like more clarity, not more fog.',
        ],
        note: 'This is where the interface stops being a demo and starts being a habit.',
      },
    ],
  },
  incidents: {
    eyebrow: 'The incident log',
    title: 'The dangerous version of an AI failure is usually the polite one.',
    body:
      'It sounds reasonable. It completes quickly. It leaves behind just enough ambiguity to waste a team’s next hour. These are the moments MUTX is built to break open.',
    items: [
      {
        id: 'cleanup',
        label: 'Case file 01',
        title: 'Cleanup became deletion.',
        trigger: 'Prompt: "Clean up my Downloads folder."',
        log: [
          'agent · removed 847 files from ~/Downloads',
          'agent · emptied Trash to save space',
          'agent · detected work documents but treated them as duplicates',
        ],
        resolution:
          'MUTX exposes the file action before it settles, so the operator can stop the run at the boundary instead of reading the apology afterward.',
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
          'MUTX keeps destination boundaries explicit, so the agent cannot quietly widen the audience while sounding helpful.',
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
          'MUTX makes the planned impact visible before execution, so the operator can approve, deny, or reroute the run before the blast radius opens.',
      },
    ],
  },
  controlRoom: {
    eyebrow: 'How the system stays legible',
    title: 'One surface for the run, the rule, and the proof.',
    body:
      'The product is designed like a working control room: one place to see the move, one place to set the line, and one place to keep the record that survives the meeting after.',
    mediaSrc: '/landing/webp/hero-manifesto.webp',
    mediaAlt: 'A bold MUTX control composition used as the central control room scene.',
    pillars: [
      {
        label: 'Observe',
        title: 'See the exact line where the agent becomes consequential.',
        body: 'Runs, traces, and posture stay aligned so the operator can orient instantly.',
      },
      {
        label: 'Constrain',
        title: 'Put the boundary in front of the action instead of after it.',
        body: 'Approvals and guardrails are part of the flow, not a buried admin screen.',
      },
      {
        label: 'Prove',
        title: 'Keep the evidence clean enough to survive review.',
        body: 'Logs become an accountable record, not just exhaust from the runtime.',
      },
    ],
  },
  entryPoints: {
    eyebrow: 'Choose your first page',
    title: 'Enter through the lane that matches your attention span.',
    body:
      'Some people want the guided product path. Some want the release lane. Some want the repo. The point is to let the work start where curiosity is already real.',
    items: [
      {
        label: 'Guided path',
        title: 'Open PicoMUTX',
        body: 'Walk the lesson path, ask the tutor, and move through a live product surface instead of a marketing dead end.',
        href: 'https://pico.mutx.dev',
        external: true,
      },
      {
        label: 'Release lane',
        title: 'Read the current release',
        body: 'Go straight to the signed macOS release, notes, and the exact public artifact trail.',
        href: '/releases',
      },
      {
        label: 'Repository',
        title: 'Inspect the code',
        body: 'If trust begins in the repo for you, start there and work forward from the source.',
        href: 'https://github.com/mutx-dev/mutx-dev',
        external: true,
      },
    ],
  },
  cta: {
    eyebrow: 'Final page',
    title: 'If the story works, the next step should be product, not persuasion.',
    body:
      'Download the Mac app, open PicoMUTX, or read the repo. The point of this front door is to get you to a truthful surface fast.',
    quote: 'A control plane should read like a calm book in the middle of a messy week.',
    mediaSrc: '/landing/webp/reading-bench.webp',
    mediaAlt: 'A quiet reading scene that closes the public narrative with a calmer note.',
    actions: [
      {
        label: 'Download for Mac',
        href: '/download',
        tone: 'primary',
      },
      {
        label: 'Go to PicoMUTX',
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
