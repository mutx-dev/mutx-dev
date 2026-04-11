export type PicoLessonStep = {
  title: string
  body: string
}

export type PicoDocLink = {
  label: string
  href: string
  sourcePath: string
}

export type PicoLesson = {
  id: string
  slug: string
  title: string
  summary: string
  objective: string
  level: number
  trackId: string
  xpReward: number
  estimatedMinutes: number
  prerequisites: string[]
  outcome: string
  validation: string[]
  troubleshooting: string[]
  steps: PicoLessonStep[]
  docLinks: PicoDocLink[]
  nextLessonId?: string
}

export type PicoTrack = {
  id: string
  title: string
  summary: string
  outcome: string
  lessonIds: string[]
}

export type PicoLevel = {
  id: number
  title: string
  objective: string
  projectOutcome: string
  xpReward: number
  unlockSignal: string
  recommendedNext: string
}

export type PicoPlan = 'free' | 'starter' | 'pro' | 'team'

export type PicoPlanFeature = {
  plan: PicoPlan
  title: string
  tutorQuestions: string
  monitoredAgents: string
  alerts: string
  approvals: string
  retention: string
}

export type PicoProductState = {
  version: number
  started_at?: string | null
  updated_at?: string | null
  effective_plan?: string | null
  plan_source?: string | null
  focus_track_id: string
  xp: number
  started_lesson_ids: string[]
  completed_lesson_ids: string[]
  earned_badge_ids: string[]
  unlocked_level_ids: number[]
  milestone_ids: string[]
  events: Array<Record<string, unknown>>
  alert_config: {
    enabled: boolean
    monthly_budget_usd: number
    notify_email: boolean
    notify_webhook: boolean
  }
  approval_gate: {
    enabled: boolean
    risky_action: string
    pending_requests: Array<Record<string, unknown>>
    last_reviewed_at?: string | null
  }
  tutor: {
    free_questions_remaining: number
    questions_asked: number
    escalations: number
    history: Array<Record<string, unknown>>
  }
}

export const picoLevels: PicoLevel[] = [
  {
    id: 0,
    title: 'Level 0 - Setup',
    objective: 'Install Hermes and prove you can get a real response.',
    projectOutcome: 'A working local Hermes setup.',
    xpReward: 100,
    unlockSignal: 'Setup verified badge',
    recommendedNext: 'Run your first agent and move into deployment.',
  },
  {
    id: 1,
    title: 'Level 1 - Deployment',
    objective: 'Move the agent into a persistent runtime.',
    projectOutcome: 'A deployed agent that survives past one shell session.',
    xpReward: 150,
    unlockSignal: 'Deployment online badge',
    recommendedNext: 'Add real capability so the agent does useful work.',
  },
  {
    id: 2,
    title: 'Level 2 - Capability',
    objective: 'Add a skill or tool and finish a useful task.',
    projectOutcome: 'An agent that does at least one thing that matters.',
    xpReward: 175,
    unlockSignal: 'Useful agent badge',
    recommendedNext: 'Automate the work so it repeats without babysitting.',
  },
  {
    id: 3,
    title: 'Level 3 - Automation',
    objective: 'Schedule execution and repeat a workflow safely.',
    projectOutcome: 'A recurring agent workflow.',
    xpReward: 200,
    unlockSignal: 'Workflow builder badge',
    recommendedNext: 'Add visibility so failures are obvious.',
  },
  {
    id: 4,
    title: 'Level 4 - Production',
    objective: 'See runs, health, logs, and failure posture.',
    projectOutcome: 'A visible operating agent.',
    xpReward: 225,
    unlockSignal: 'Production visibility badge',
    recommendedNext: 'Add thresholds and approvals.',
  },
  {
    id: 5,
    title: 'Level 5 - Control',
    objective: 'Set cost thresholds and require approval for risky actions.',
    projectOutcome: 'A governed agent you trust more.',
    xpReward: 250,
    unlockSignal: 'Control plane badge',
    recommendedNext: 'Package the pattern so it becomes reusable.',
  },
  {
    id: 6,
    title: 'Level 6 - Systems',
    objective: 'Combine the pieces into a reusable production pattern.',
    projectOutcome: 'A serious pattern you can deploy again.',
    xpReward: 300,
    unlockSignal: 'Systems builder badge',
    recommendedNext: 'Scale up into deeper MUTX workflows.',
  },
]

export const picoTracks: PicoTrack[] = [
  {
    id: 'track-a-first-agent',
    title: 'Track A - First Agent',
    summary: 'Get Hermes installed and answering real input.',
    outcome: 'Hermes runs and responds on your machine.',
    lessonIds: ['install-hermes-locally', 'run-your-first-agent'],
  },
  {
    id: 'track-b-deployed-agent',
    title: 'Track B - Deployed Agent',
    summary: 'Keep the agent alive on a persistent environment.',
    outcome: 'A deployed agent that stays up.',
    lessonIds: ['deploy-hermes-on-a-vps', 'keep-your-agent-alive', 'connect-a-messaging-layer'],
  },
  {
    id: 'track-c-useful-workflow',
    title: 'Track C - Useful Workflow',
    summary: 'Add capability and make the agent perform a concrete job.',
    outcome: 'One useful workflow in production.',
    lessonIds: [
      'add-your-first-skill-tool',
      'create-a-scheduled-workflow',
      'build-a-lead-response-agent',
      'build-a-document-processing-agent',
    ],
  },
  {
    id: 'track-d-controlled-agent',
    title: 'Track D - Controlled Agent',
    summary: 'Make runtime activity visible and add guardrails.',
    outcome: 'An agent you can inspect, threshold, and gate.',
    lessonIds: ['see-your-agent-activity', 'set-a-cost-threshold', 'add-an-approval-gate'],
  },
  {
    id: 'track-e-production-pattern',
    title: 'Track E - Production Pattern',
    summary: 'Combine the pieces into a reusable operating pattern.',
    outcome: 'A production pattern you can repeat.',
    lessonIds: ['production-pattern-hermes-ops'],
  },
]

export const picoPlanFeatures: PicoPlanFeature[] = [
  {
    plan: 'free',
    title: 'Free',
    tutorQuestions: '5 grounded questions',
    monitoredAgents: '1 snapshot',
    alerts: 'Read-only',
    approvals: 'Preview only',
    retention: 'Short local history',
  },
  {
    plan: 'starter',
    title: 'Starter',
    tutorQuestions: '25 grounded questions',
    monitoredAgents: '1 monitored agent',
    alerts: 'Thresholds enabled',
    approvals: 'One approval gate',
    retention: '7 days',
  },
  {
    plan: 'pro',
    title: 'Pro',
    tutorQuestions: 'Unlimited practical help',
    monitoredAgents: 'Multiple monitored agents',
    alerts: 'Email and webhook paths',
    approvals: 'Multiple gates',
    retention: '30 days',
  },
  {
    plan: 'team',
    title: 'Team',
    tutorQuestions: 'Unlimited',
    monitoredAgents: 'Shared fleet',
    alerts: 'Shared routing',
    approvals: 'Team review flows',
    retention: 'Longer retention when real team support lands',
  },
]

export const picoLessons: PicoLesson[] = [
  {
    id: 'install-hermes-locally',
    slug: 'install-hermes-locally',
    title: 'Install Hermes locally',
    summary: 'Get Hermes installed without guessing your way through setup.',
    objective: 'Install Hermes and verify the binary works.',
    level: 0,
    trackId: 'track-a-first-agent',
    xpReward: 60,
    estimatedMinutes: 20,
    prerequisites: ['A terminal on macOS or Linux', 'Node or Python bootstrap basics'],
    outcome: 'Hermes is installed and the CLI starts cleanly.',
    validation: [
      'Run the install path from the quickstart and confirm Hermes starts.',
      'Open the CLI and verify you can see the prompt without stack traces.',
    ],
    troubleshooting: [
      'If install fails, use the quickstart exactly before freelancing your own path.',
      'If the binary is missing, re-run the install step and check your PATH.',
    ],
    steps: [
      { title: 'Read the quickstart first', body: 'Use the repo quickstart as ground truth before copying random blog commands.' },
      { title: 'Run the supported install path', body: 'Follow the install script or repo bootstrap path that MUTX already documents.' },
      { title: 'Verify the CLI launches', body: 'Start Hermes and confirm the shell opens without config or dependency errors.' },
    ],
    docLinks: [
      { label: 'Quickstart', href: '/docs/deployment/quickstart', sourcePath: 'docs/deployment/quickstart.md' },
      { label: 'CLI reference', href: '/docs/cli', sourcePath: 'docs/cli.md' },
    ],
    nextLessonId: 'run-your-first-agent',
  },
  {
    id: 'run-your-first-agent',
    slug: 'run-your-first-agent',
    title: 'Run your first agent',
    summary: 'Get a real response and prove the environment is wired up.',
    objective: 'Run Hermes and complete a first useful interaction.',
    level: 0,
    trackId: 'track-a-first-agent',
    xpReward: 70,
    estimatedMinutes: 20,
    prerequisites: ['Install Hermes locally'],
    outcome: 'You can prompt Hermes and get a working response.',
    validation: [
      'Run the CLI and complete one real prompt-response loop.',
      'Capture the response as your first artifact.',
    ],
    troubleshooting: [
      'If model access fails, confirm your provider config before touching app code.',
      'If the session hangs, start again with the minimal quickstart flow.',
    ],
    steps: [
      { title: 'Launch Hermes', body: 'Start the agent from the supported CLI entrypoint.' },
      { title: 'Give it a concrete prompt', body: 'Ask Hermes to do a tiny real task so you can see end-to-end behavior.' },
      { title: 'Save the output', body: 'Treat the response as your first artifact. The lesson is not done until you have one.' },
    ],
    docLinks: [
      { label: 'Quickstart', href: '/docs/deployment/quickstart', sourcePath: 'docs/deployment/quickstart.md' },
      { label: 'CLI reference', href: '/docs/cli', sourcePath: 'docs/cli.md' },
    ],
    nextLessonId: 'deploy-hermes-on-a-vps',
  },
  {
    id: 'deploy-hermes-on-a-vps',
    slug: 'deploy-hermes-on-a-vps',
    title: 'Deploy Hermes on a VPS',
    summary: 'Move from local novelty to a persistent runtime.',
    objective: 'Deploy Hermes onto a persistent host.',
    level: 1,
    trackId: 'track-b-deployed-agent',
    xpReward: 90,
    estimatedMinutes: 40,
    prerequisites: ['Run your first agent', 'Access to a VPS or persistent host'],
    outcome: 'Hermes runs outside your laptop session.',
    validation: [
      'Connect to the host and confirm Hermes starts there.',
      'Document the runtime path and restart method.',
    ],
    troubleshooting: [
      'If the host setup is messy, use Docker or the documented deploy path instead of improvising systemd first.',
      'If ports or env vars are wrong, stop and fix them before adding any messaging surface.',
    ],
    steps: [
      { title: 'Pick the smallest persistent host', body: 'A cheap VPS is enough for the first production lane.' },
      { title: 'Deploy with a documented path', body: 'Use the repo deployment docs as source of truth.' },
      { title: 'Record how to reconnect and restart', body: 'A deployment without an operating note is half-done.' },
    ],
    docLinks: [
      { label: 'Production deploy', href: '/docs/deployment/production', sourcePath: 'docs/deployment/production.md' },
      { label: 'Docker deploy', href: '/docs/deployment/docker', sourcePath: 'docs/deployment/docker.md' },
    ],
    nextLessonId: 'keep-your-agent-alive',
  },
  {
    id: 'keep-your-agent-alive',
    slug: 'keep-your-agent-alive',
    title: 'Keep your agent alive between sessions',
    summary: 'Get past the fragile one-shell demo stage.',
    objective: 'Make the runtime survive disconnects and restarts.',
    level: 1,
    trackId: 'track-b-deployed-agent',
    xpReward: 75,
    estimatedMinutes: 25,
    prerequisites: ['Deploy Hermes on a VPS'],
    outcome: 'Hermes stays up after you leave the shell.',
    validation: [
      'Disconnect and reconnect without losing the runtime.',
      'Write down the restart command or supervisor path.',
    ],
    troubleshooting: [
      'If the process only works in one terminal, you do not have deployment yet.',
      'Do not add extra layers until the keepalive path is boring and reliable.',
    ],
    steps: [
      { title: 'Choose the keepalive path', body: 'Pick one supervisor path and stick to it.' },
      { title: 'Restart-test it', body: 'Deliberately bounce the process and make sure you can recover it.' },
      { title: 'Store the runbook', body: 'The runbook is part of the artifact.' },
    ],
    docLinks: [
      { label: 'Quickstart', href: '/docs/deployment/quickstart', sourcePath: 'docs/deployment/quickstart.md' },
      { label: 'Common issues', href: '/docs/troubleshooting/common-issues', sourcePath: 'docs/troubleshooting/common-issues.md' },
    ],
    nextLessonId: 'connect-a-messaging-layer',
  },
  {
    id: 'connect-a-messaging-layer',
    slug: 'connect-a-messaging-layer',
    title: 'Connect a messaging or interface layer',
    summary: 'Give the agent a practical surface instead of a lonely terminal.',
    objective: 'Connect one interface path that makes the agent usable.',
    level: 1,
    trackId: 'track-b-deployed-agent',
    xpReward: 85,
    estimatedMinutes: 35,
    prerequisites: ['Keep your agent alive between sessions'],
    outcome: 'The agent accepts input through a stable interface.',
    validation: [
      'Send one real message or request through the chosen interface.',
      'Confirm the response reaches the user-facing surface.',
    ],
    troubleshooting: [
      'If auth or webhooks are unclear, use one interface and prove it before adding a second.',
      'Avoid multi-channel sprawl in v1.',
    ],
    steps: [
      { title: 'Choose one interface', body: 'A messaging surface or simple request path is enough.' },
      { title: 'Wire the config', body: 'Connect the agent using the documented assistant/runtime path.' },
      { title: 'Send a real message', body: 'Validate the full round trip with a concrete request.' },
    ],
    docLinks: [
      { label: 'App surfaces', href: '/docs/surfaces', sourcePath: 'docs/surfaces.md' },
      { label: 'API authentication', href: '/docs/api/authentication', sourcePath: 'docs/api/authentication.md' },
    ],
    nextLessonId: 'add-your-first-skill-tool',
  },
  {
    id: 'add-your-first-skill-tool',
    slug: 'add-your-first-skill-tool',
    title: 'Add your first skill or tool',
    summary: 'Teach the agent to do something beyond chat.',
    objective: 'Add one skill/tool and use it in a real task.',
    level: 2,
    trackId: 'track-c-useful-workflow',
    xpReward: 100,
    estimatedMinutes: 30,
    prerequisites: ['Connect a messaging or interface layer'],
    outcome: 'The agent can perform one concrete capability.',
    validation: [
      'Run the agent through the new capability once.',
      'Save the output or artifact produced by the task.',
    ],
    troubleshooting: [
      'One reliable skill beats three half-wired ones.',
      'If the skill path is unclear, simplify the task until validation is obvious.',
    ],
    steps: [
      { title: 'Pick a narrow capability', body: 'Choose something you can validate in minutes.' },
      { title: 'Wire the skill', body: 'Add the tool or skill and make it callable from the agent flow.' },
      { title: 'Use it on a real task', body: 'The lesson ends when the new capability produces a useful output.' },
    ],
    docLinks: [
      { label: 'Quickstart', href: '/docs/quickstart', sourcePath: 'docs/quickstart.md' },
      { label: 'CLI reference', href: '/docs/cli', sourcePath: 'docs/cli.md' },
    ],
    nextLessonId: 'create-a-scheduled-workflow',
  },
  {
    id: 'create-a-scheduled-workflow',
    slug: 'create-a-scheduled-workflow',
    title: 'Create a scheduled workflow',
    summary: 'Make the agent run on a clock instead of by hand.',
    objective: 'Create one repeatable schedule or workflow.',
    level: 3,
    trackId: 'track-c-useful-workflow',
    xpReward: 110,
    estimatedMinutes: 35,
    prerequisites: ['Add your first skill or tool'],
    outcome: 'A recurring task that runs without manual prompting.',
    validation: [
      'Define one schedule and confirm it triggers.',
      'Capture the output or event from one scheduled run.',
    ],
    troubleshooting: [
      'If scheduling becomes a systems project, reduce scope fast.',
      'One boring schedule is enough for v1.',
    ],
    steps: [
      { title: 'Choose the repeated task', body: 'Pick something stable and easy to verify.' },
      { title: 'Set the schedule', body: 'Use the simplest supported recurring execution path.' },
      { title: 'Verify one run', body: 'The schedule is not real until you observe a triggered run.' },
    ],
    docLinks: [
      { label: 'Quickstart', href: '/docs/deployment/quickstart', sourcePath: 'docs/deployment/quickstart.md' },
      { label: 'Debugging', href: '/docs/troubleshooting/debugging', sourcePath: 'docs/troubleshooting/debugging.md' },
    ],
    nextLessonId: 'see-your-agent-activity',
  },
  {
    id: 'see-your-agent-activity',
    slug: 'see-your-agent-activity',
    title: 'See your agent activity',
    summary: 'Stop guessing whether the agent is alive or dead.',
    objective: 'Inspect runs, activity, and alert posture.',
    level: 4,
    trackId: 'track-d-controlled-agent',
    xpReward: 120,
    estimatedMinutes: 20,
    prerequisites: ['Create a scheduled workflow'],
    outcome: 'You can inspect recent activity in the autopilot layer.',
    validation: [
      'Open the autopilot panel and inspect runs or empty states.',
      'Explain what the last run or last missing signal means.',
    ],
    troubleshooting: [
      'No activity is still useful truth. Do not fake a healthy state.',
      'If the backend is empty, focus on the missing runtime signal, not pretty charts.',
    ],
    steps: [
      { title: 'Open the autopilot panel', body: 'Use the Pico workspace autopilot slice.' },
      { title: 'Inspect recent runs and alerts', body: 'Read what actually happened, not what you hoped happened.' },
      { title: 'Record the next operating move', body: 'Visibility matters only if it changes your next action.' },
    ],
    docLinks: [
      { label: 'App dashboard', href: '/docs/app-dashboard', sourcePath: 'docs/app-dashboard.md' },
      { label: 'Monitoring', href: '/docs/MONITORING', sourcePath: 'docs/MONITORING.md' },
    ],
    nextLessonId: 'set-a-cost-threshold',
  },
  {
    id: 'set-a-cost-threshold',
    slug: 'set-a-cost-threshold',
    title: 'Set a cost threshold',
    summary: 'Make budget pressure visible before it bites you.',
    objective: 'Set a monthly threshold for one agent or for your workspace.',
    level: 5,
    trackId: 'track-d-controlled-agent',
    xpReward: 120,
    estimatedMinutes: 15,
    prerequisites: ['See your agent activity'],
    outcome: 'A visible budget threshold is configured.',
    validation: [
      'Save a threshold in the Pico workspace.',
      'Verify the saved number persists after refresh.',
    ],
    troubleshooting: [
      'If you do not know the exact spend yet, set a low threshold and tighten later.',
      'A rough honest threshold beats zero threshold.',
    ],
    steps: [
      { title: 'Pick the limit', body: 'Start with a number you actually care about crossing.' },
      { title: 'Save the threshold', body: 'Persist the alert config in Pico.' },
      { title: 'Re-open the panel', body: 'Make sure the setting survives refresh.' },
    ],
    docLinks: [
      { label: 'App dashboard', href: '/docs/app-dashboard', sourcePath: 'docs/app-dashboard.md' },
      { label: 'API reference', href: '/docs/api/reference', sourcePath: 'docs/api/reference.md' },
    ],
    nextLessonId: 'add-an-approval-gate',
  },
  {
    id: 'add-an-approval-gate',
    slug: 'add-an-approval-gate',
    title: 'Add an approval gate',
    summary: 'Require a human checkpoint before risky changes.',
    objective: 'Enable the default deployment-change approval gate.',
    level: 5,
    trackId: 'track-d-controlled-agent',
    xpReward: 130,
    estimatedMinutes: 15,
    prerequisites: ['Set a cost threshold'],
    outcome: 'A risky action gate is enabled for deployment changes.',
    validation: [
      'Enable the gate and confirm it persists.',
      'Explain which risky action the gate is protecting.',
    ],
    troubleshooting: [
      'Do not wire a broad fake governance layer. One clear gate is enough for v1.',
      'If you cannot explain the protected action, the gate is too vague.',
    ],
    steps: [
      { title: 'Enable the gate', body: 'Turn on the deployment-change approval gate.' },
      { title: 'Review the protected action', body: 'Make sure the user understands what now requires review.' },
      { title: 'Persist the config', body: 'Refresh and confirm the setting sticks.' },
    ],
    docLinks: [
      { label: 'Governance overview', href: '/docs/governance', sourcePath: 'docs/governance.md' },
      { label: 'Security architecture', href: '/docs/architecture/security', sourcePath: 'docs/architecture/security.md' },
    ],
    nextLessonId: 'production-pattern-hermes-ops',
  },
  {
    id: 'build-a-lead-response-agent',
    slug: 'build-a-lead-response-agent',
    title: 'Build a lead-response style agent',
    summary: 'Turn a simple business workflow into a useful agent path.',
    objective: 'Build a narrow lead-response workflow.',
    level: 2,
    trackId: 'track-c-useful-workflow',
    xpReward: 140,
    estimatedMinutes: 45,
    prerequisites: ['Add your first skill or tool'],
    outcome: 'A lead-response workflow with one clear output.',
    validation: [
      'Process one lead-like input and generate the response artifact.',
      'Confirm the workflow has one owner and one KPI.',
    ],
    troubleshooting: [
      'Keep the scope brutally narrow. One workflow, one owner, one output.',
      'If it starts sounding like a CRM rebuild, kill that idea immediately.',
    ],
    steps: [
      { title: 'Choose the input', body: 'A contact or lead payload is enough.' },
      { title: 'Generate the response', body: 'Make the agent produce the follow-up artifact.' },
      { title: 'Save the operating note', body: 'Write down how the workflow gets triggered and reviewed.' },
    ],
    docLinks: [
      { label: 'Leads API', href: '/docs/api/leads', sourcePath: 'docs/api/leads.md' },
      { label: 'Support', href: '/support', sourcePath: 'support.md' },
    ],
    nextLessonId: 'see-your-agent-activity',
  },
  {
    id: 'build-a-document-processing-agent',
    slug: 'build-a-document-processing-agent',
    title: 'Build a document-processing style agent',
    summary: 'Use a document-heavy path to practice extraction and control.',
    objective: 'Create a narrow document-processing workflow.',
    level: 2,
    trackId: 'track-c-useful-workflow',
    xpReward: 140,
    estimatedMinutes: 45,
    prerequisites: ['Add your first skill or tool'],
    outcome: 'A document-processing workflow with a verifiable output.',
    validation: [
      'Process one document and save the output artifact.',
      'Verify the operator can inspect what happened.',
    ],
    troubleshooting: [
      'Keep one document type in scope.',
      'If extraction is flaky, simplify the source document before adding cleverness.',
    ],
    steps: [
      { title: 'Pick one document type', body: 'Use a narrow document class that matters to the workflow.' },
      { title: 'Define the output', body: 'The agent should produce one clear structured result.' },
      { title: 'Validate the extraction', body: 'Check the output against the source before calling it done.' },
    ],
    docLinks: [
      { label: 'Debugging', href: '/docs/troubleshooting/debugging', sourcePath: 'docs/troubleshooting/debugging.md' },
      { label: 'Common issues', href: '/docs/troubleshooting/common-issues', sourcePath: 'docs/troubleshooting/common-issues.md' },
    ],
    nextLessonId: 'see-your-agent-activity',
  },
  {
    id: 'production-pattern-hermes-ops',
    slug: 'production-pattern-hermes-ops',
    title: 'Production pattern: Hermes ops loop',
    summary: 'Tie setup, deployment, visibility, thresholds, and approvals into one pattern.',
    objective: 'Build a reusable operating pattern from the previous lessons.',
    level: 6,
    trackId: 'track-e-production-pattern',
    xpReward: 180,
    estimatedMinutes: 45,
    prerequisites: ['Add an approval gate', 'Set a cost threshold', 'See your agent activity'],
    outcome: 'A reusable Hermes operating pattern with control hooks.',
    validation: [
      'Document the full loop from deploy to monitor to govern.',
      'List the exact thresholds, run views, and approval checkpoints you rely on.',
    ],
    troubleshooting: [
      'Do not add abstract architecture for sport.',
      'If the pattern cannot be repeated by you next week, it is not a pattern yet.',
    ],
    steps: [
      { title: 'Summarize the operating loop', body: 'Write the path from build to control in plain language.' },
      { title: 'Capture the controls', body: 'Document the threshold and approval settings that matter.' },
      { title: 'Verify the loop with one fresh run', body: 'Watch a real run or honest empty state and update the pattern notes.' },
    ],
    docLinks: [
      { label: 'Overview', href: '/docs/overview', sourcePath: 'docs/overview.md' },
      { label: 'Monitoring', href: '/docs/MONITORING', sourcePath: 'docs/MONITORING.md' },
    ],
  },
]

export const picoLessonById = Object.fromEntries(picoLessons.map((lesson) => [lesson.id, lesson]))
export const picoLessonBySlug = Object.fromEntries(picoLessons.map((lesson) => [lesson.slug, lesson]))
