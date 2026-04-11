export type PicoPlan = 'free' | 'starter' | 'pro'
export type PicoLessonDifficulty = 'setup' | 'operator' | 'builder'

export type PicoLessonStep = {
  title: string
  body: string
  command?: string
  note?: string
}

export type PicoLesson = {
  slug: string
  title: string
  summary: string
  level: number
  track: string
  estimatedMinutes: number
  difficulty: PicoLessonDifficulty
  objective: string
  prerequisites: string[]
  outcome: string
  expectedResult: string
  validation: string
  xp: number
  steps: PicoLessonStep[]
  troubleshooting: string[]
  nextLesson?: string
  milestoneEvents?: string[]
}

export type PicoLevel = {
  id: number
  title: string
  objective: string
  projectOutcome: string
  completionState: string
  xpReward: number
  badge: string
  recommendedNextStep: string
}

export type PicoTrack = {
  slug: string
  title: string
  outcome: string
  intro: string
  lessons: string[]
  checklist: string[]
  nextTrack?: string
}

export type PicoPlanDefinition = {
  label: string
  items: string[]
}

export const PICO_PLAN_ORDER: PicoPlan[] = ['free', 'starter', 'pro']


export type PicoProgressState = {
  version: number
  startedAt: string
  updatedAt: string
  selectedTrack: string | null
  startedLessons: string[]
  completedLessons: string[]
  milestoneEvents: string[]
  tutorQuestions: number
  supportRequests: number
  helpfulResponses: number
  sharedProjects: string[]
  autopilot: {
    costThresholdPercent: number
    alertChannel: 'in_app' | 'email' | 'webhook'
    approvalGateEnabled: boolean
    approvalRequestIds: string[]
    lastThresholdBreachAt: string | null
  }
}

export type PicoDerivedProgress = {
  xp: number
  currentLevel: number
  totalLessons: number
  completedLessonCount: number
  completedTrackSlugs: string[]
  badges: string[]
  unlockedLessonSlugs: string[]
  unlockedTrackSlugs: string[]
  nextLesson: PicoLesson | null
}

export const PICO_MILESTONE_XP: Record<string, number> = {
  account_created: 20,
  first_tutorial_started: 15,
  first_tutorial_completed: 25,
  first_agent_run: 40,
  successful_deployment: 60,
  first_skill_added: 50,
  first_workflow_built: 70,
  first_monitoring_event_seen: 45,
  first_alert_configured: 45,
  first_approval_gate_enabled: 60,
  project_shared: 40,
  helpful_community_response: 35,
}

export const PICO_PLAN_DEFINITIONS: Record<PicoPlan, PicoPlanDefinition> = {
  free: {
    label: 'FREE',
    items: ['academy', '1 agent (limited visibility)', 'no alerts', 'no approvals'],
  },
  starter: {
    label: 'STARTER',
    items: ['1 agent monitored', 'alerts', 'basic history'],
  },
  pro: {
    label: 'PRO',
    items: ['multiple agents', 'approvals', 'deeper control', 'longer retention'],
  },
}

export const PICO_LEVELS: PicoLevel[] = [
  {
    id: 0,
    title: 'Setup',
    objective: 'Get Hermes installed and prove the runtime answers a real prompt.',
    projectOutcome: 'A working local agent that responds on command.',
    completionState: 'Hermes runs locally and returns a sane answer.',
    xpReward: 120,
    badge: 'First Spark',
    recommendedNextStep: 'Deploy the same runtime somewhere persistent.',
  },
  {
    id: 1,
    title: 'Deployment',
    objective: 'Move the agent off the laptop and keep it alive.',
    projectOutcome: 'A persistent agent on a VPS or always-on box.',
    completionState: 'The agent survives shell exits and accepts remote traffic.',
    xpReward: 170,
    badge: 'Runtime Ranger',
    recommendedNextStep: 'Add one useful capability.',
  },
  {
    id: 2,
    title: 'Capability',
    objective: 'Teach the agent a concrete skill with a bounded job.',
    projectOutcome: 'A useful skill or tool call bound to a real task.',
    completionState: 'The agent completes one useful workflow step.',
    xpReward: 150,
    badge: 'Skillsmith',
    recommendedNextStep: 'Automate the cadence.',
  },
  {
    id: 3,
    title: 'Automation',
    objective: 'Run the agent on a repeatable schedule.',
    projectOutcome: 'A scheduled workflow that fires without babysitting.',
    completionState: 'The workflow runs on a clock and logs the result.',
    xpReward: 160,
    badge: 'Loop Builder',
    recommendedNextStep: 'Turn on visibility.',
  },
  {
    id: 4,
    title: 'Production',
    objective: 'See the run history and catch failure modes early.',
    projectOutcome: 'A user can inspect runs, failures, and runtime state.',
    completionState: 'Run activity appears in the control layer.',
    xpReward: 170,
    badge: 'Signal Hunter',
    recommendedNextStep: 'Add cost and approval controls.',
  },
  {
    id: 5,
    title: 'Control',
    objective: 'Add cost thresholds, alerts, and a risky-action gate.',
    projectOutcome: 'The agent can be watched and interrupted before it causes damage.',
    completionState: 'Thresholds and approvals are configured.',
    xpReward: 210,
    badge: 'Gatekeeper',
    recommendedNextStep: 'Ship a deeper pattern.',
  },
  {
    id: 6,
    title: 'Systems',
    objective: 'Ship a reusable production pattern, not a toy demo.',
    projectOutcome: 'One serious workflow a founder could run in production.',
    completionState: 'A stronger pattern ships with a real artifact and control surface.',
    xpReward: 240,
    badge: 'Pattern Operator',
    recommendedNextStep: 'Move from one agent to a governed fleet.',
  },
]

export const PICO_TRACKS: PicoTrack[] = [
  {
    slug: 'first-agent',
    title: 'Track A — First Agent',
    outcome: 'Hermes runs and answers real prompts.',
    intro: 'This is the fast path from zero to a working local runtime.',
    lessons: ['install-hermes-locally', 'run-your-first-agent'],
    checklist: [
      'Hermes installed',
      'Model/provider configured',
      'One successful response captured',
    ],
    nextTrack: 'deployed-agent',
  },
  {
    slug: 'deployed-agent',
    title: 'Track B — Deployed Agent',
    outcome: 'The runtime stays alive somewhere persistent.',
    intro: 'Move from laptop demo to a process that survives sleep and reboots.',
    lessons: [
      'deploy-hermes-on-a-vps',
      'keep-your-agent-alive',
      'connect-a-messaging-layer',
    ],
    checklist: [
      'VPS or persistent box online',
      'Service restarts cleanly',
      'Messaging ingress connected',
    ],
    nextTrack: 'useful-workflow',
  },
  {
    slug: 'useful-workflow',
    title: 'Track C — Useful Workflow',
    outcome: 'The agent performs a bounded job that matters.',
    intro: 'Now stop playing with prompts and build one useful capability.',
    lessons: [
      'add-your-first-skill',
      'create-a-scheduled-workflow',
      'build-a-lead-response-agent',
    ],
    checklist: [
      'At least one custom skill installed',
      'One scheduled workflow configured',
      'One business-flavored workflow completed',
    ],
    nextTrack: 'controlled-agent',
  },
  {
    slug: 'controlled-agent',
    title: 'Track D — Controlled Agent',
    outcome: 'The runtime is visible and governed.',
    intro: 'This is where the babysitter problem gets replaced by operator tools.',
    lessons: [
      'see-your-agent-activity',
      'set-a-cost-threshold',
      'add-an-approval-gate',
    ],
    checklist: [
      'Recent activity visible',
      'Cost threshold stored',
      'Approval request flow exercised',
    ],
    nextTrack: 'production-pattern',
  },
  {
    slug: 'production-pattern',
    title: 'Track E — Production Pattern',
    outcome: 'A stronger, reusable workflow is live.',
    intro: 'Take the foundations and ship a pattern someone would actually pay for.',
    lessons: ['build-a-document-processing-agent'],
    checklist: [
      'Structured input accepted',
      'Output validated',
      'Runs visible from the control layer',
    ],
  },
]

export const PICO_RELEASE_NOTES = [
  {
    title: 'Pico shell lands inside MUTX',
    date: '2026-04-11',
    body: 'Academy, tutor, support, and autopilot now live in one surface instead of a marketing-only landing page.',
  },
  {
    title: 'Progress persistence switched to user settings',
    date: '2026-04-11',
    body: 'Authenticated users sync progress to the backend while anonymous users keep a local fallback.',
  },
  {
    title: 'Autopilot now reads real MUTX signals',
    date: '2026-04-11',
    body: 'Runs, alerts, budgets, and approvals are pulled from live MUTX routes. No fake telemetry theater.',
  },
] as const

export const PICO_SHOWCASE_PATTERNS = [
  {
    title: 'Lead-response operator',
    lessonSlug: 'build-a-lead-response-agent',
    summary: 'Takes an inbound lead, drafts the first reply, and waits for approval before the risky send.',
  },
  {
    title: 'Document triage lane',
    lessonSlug: 'build-a-document-processing-agent',
    summary: 'Ingests files, extracts the useful parts, tags the result, and surfaces runs for review.',
  },
  {
    title: 'Daily workflow loop',
    lessonSlug: 'create-a-scheduled-workflow',
    summary: 'Turns one useful prompt into a repeatable operator habit with logs and timing.',
  },
] as const

export const PICO_BADGE_RULES = [
  {
    id: 'first-spark',
    label: 'First Spark',
    test: (completedLessons: Set<string>) =>
      completedLessons.has('install-hermes-locally') && completedLessons.has('run-your-first-agent'),
  },
  {
    id: 'runtime-ranger',
    label: 'Runtime Ranger',
    test: (completedLessons: Set<string>) =>
      completedLessons.has('deploy-hermes-on-a-vps') && completedLessons.has('keep-your-agent-alive'),
  },
  {
    id: 'skillsmith',
    label: 'Skillsmith',
    test: (completedLessons: Set<string>) => completedLessons.has('add-your-first-skill'),
  },
  {
    id: 'loop-builder',
    label: 'Loop Builder',
    test: (completedLessons: Set<string>) => completedLessons.has('create-a-scheduled-workflow'),
  },
  {
    id: 'gatekeeper',
    label: 'Gatekeeper',
    test: (completedLessons: Set<string>, milestoneEvents: Set<string>) =>
      completedLessons.has('set-a-cost-threshold') &&
      completedLessons.has('add-an-approval-gate') &&
      milestoneEvents.has('first_approval_gate_enabled'),
  },
  {
    id: 'pattern-operator',
    label: 'Pattern Operator',
    test: (completedLessons: Set<string>) =>
      completedLessons.has('build-a-lead-response-agent') ||
      completedLessons.has('build-a-document-processing-agent'),
  },
] as const

export const PICO_LESSONS: PicoLesson[] = [
  {
    slug: 'install-hermes-locally',
    title: 'Install Hermes locally',
    summary: 'Get the runtime onto your machine and make sure the CLI opens cleanly.',
    level: 0,
    track: 'first-agent',
    estimatedMinutes: 15,
    difficulty: 'setup',
    objective: 'Install Hermes and confirm the CLI launches without drama.',
    prerequisites: [],
    outcome: 'A working local Hermes install.',
    expectedResult: 'You can run `hermes` and reach the interactive surface.',
    validation: 'Run `hermes` and verify the CLI boots instead of dying on missing binaries or config.',
    xp: 60,
    milestoneEvents: ['first_tutorial_started'],
    steps: [
      {
        title: 'Install the runtime',
        body: 'Use the repo-approved quick path from the Hermes docs or your package manager. Do not freelance the install method halfway through.',
        command: 'curl -fsSL https://hermes.nousresearch.com/install.sh | bash',
      },
      {
        title: 'Open the CLI once',
        body: 'Launch Hermes immediately so the first-run prompts happen now, not in the middle of a later lesson.',
        command: 'hermes',
      },
      {
        title: 'Pick one provider path',
        body: 'Choose one model/provider path and finish that setup completely. Half-configured providers are how people waste an hour.',
      },
    ],
    troubleshooting: [
      'If `hermes` is not found, restart the shell or check that the install path was added to PATH.',
      'If the CLI opens and immediately errors on missing config, finish the provider setup before moving on.',
      'If you are on a locked-down machine, use a user-local install instead of sudo theater.',
    ],
    nextLesson: 'run-your-first-agent',
  },
  {
    slug: 'run-your-first-agent',
    title: 'Run your first agent',
    summary: 'Send a real prompt through Hermes and capture the first useful output.',
    level: 0,
    track: 'first-agent',
    estimatedMinutes: 15,
    difficulty: 'setup',
    objective: 'Prove the runtime can answer a real prompt with the model you configured.',
    prerequisites: ['install-hermes-locally'],
    outcome: 'One verified local response.',
    expectedResult: 'Hermes answers a real prompt and you keep the output as proof.',
    validation: 'Ask Hermes to summarize a short input or generate a tiny action plan and save the response.',
    xp: 60,
    milestoneEvents: ['first_tutorial_completed', 'first_agent_run'],
    steps: [
      {
        title: 'Start the CLI',
        body: 'Open Hermes from a clean shell so you know you are testing the installed runtime, not a stale terminal state.',
        command: 'hermes',
      },
      {
        title: 'Run a bounded prompt',
        body: 'Use a tiny prompt with a clear answer. Example: summarize a note, rewrite a message, or plan three next steps.',
      },
      {
        title: 'Keep the proof',
        body: 'Save a screenshot or paste the output into your notes. It sounds obvious. It also saves you from “did it actually work?” brain fog later.',
      },
    ],
    troubleshooting: [
      'If the answer times out, switch to a faster model first. Do not debug everything at once.',
      'If the answer is nonsense, verify which model/provider the CLI is actually using.',
      'If the runtime refuses to start, go back and fix the install before touching deployment.',
    ],
    nextLesson: 'deploy-hermes-on-a-vps',
  },
  {
    slug: 'deploy-hermes-on-a-vps',
    title: 'Deploy Hermes on a VPS',
    summary: 'Move the runtime to a cheap always-on box so it stops depending on your laptop.',
    level: 1,
    track: 'deployed-agent',
    estimatedMinutes: 30,
    difficulty: 'operator',
    objective: 'Provision a box and get Hermes running there.',
    prerequisites: ['run-your-first-agent'],
    outcome: 'Hermes runs on a persistent environment.',
    expectedResult: 'You can SSH into the box and start Hermes there.',
    validation: 'SSH to the server, run `hermes`, and confirm the remote runtime responds.',
    xp: 60,
    milestoneEvents: ['successful_deployment'],
    steps: [
      {
        title: 'Provision the host',
        body: 'Create a small Ubuntu box or use an always-on machine you control. One CPU and low RAM is fine for the shell itself.',
      },
      {
        title: 'Install Hermes remotely',
        body: 'SSH in and repeat the same install path you used locally so the environment stays boring.',
        command: 'ssh user@your-box && curl -fsSL https://hermes.nousresearch.com/install.sh | bash',
      },
      {
        title: 'Run a smoke prompt on the box',
        body: 'Prove the remote runtime answers before you bother with services or messaging.',
      },
    ],
    troubleshooting: [
      'If SSH is flaky, fix the box before blaming Hermes.',
      'If the remote box lacks model credentials, copy only the minimum config required.',
      'If the runtime works locally but not remotely, compare environment variables first.',
    ],
    nextLesson: 'keep-your-agent-alive',
  },
  {
    slug: 'keep-your-agent-alive',
    title: 'Keep your agent alive between sessions',
    summary: 'Wrap Hermes in a service manager so closing the shell does not kill the runtime.',
    level: 1,
    track: 'deployed-agent',
    estimatedMinutes: 25,
    difficulty: 'operator',
    objective: 'Run Hermes under a service manager or terminal multiplexer.',
    prerequisites: ['deploy-hermes-on-a-vps'],
    outcome: 'Hermes survives disconnects and restarts cleanly.',
    expectedResult: 'The runtime keeps running after you log out.',
    validation: 'Disconnect from the server, reconnect, and verify the service is still up.',
    xp: 55,
    steps: [
      {
        title: 'Pick a boring process manager',
        body: 'Use `systemd` if you are on Linux. Use `tmux` only if you need a quick intermediate step.',
      },
      {
        title: 'Create the service command',
        body: 'Point the service at the exact Hermes binary and working directory you verified manually.',
      },
      {
        title: 'Restart test',
        body: 'Bounce the service once on purpose. If it cannot recover from one intentional restart, it is not production-adjacent yet.',
      },
    ],
    troubleshooting: [
      'If the service starts manually but not under systemd, compare PATH and env vars.',
      'If logs are empty, fix stdout/stderr wiring first.',
      'If you only have tmux, document the session name so you are not hunting ghosts later.',
    ],
    nextLesson: 'connect-a-messaging-layer',
  },
  {
    slug: 'connect-a-messaging-layer',
    title: 'Connect a messaging layer',
    summary: 'Give the agent a surface where you can reach it without SSH.',
    level: 1,
    track: 'deployed-agent',
    estimatedMinutes: 30,
    difficulty: 'operator',
    objective: 'Attach one practical ingress like Telegram, Discord, or Slack.',
    prerequisites: ['keep-your-agent-alive'],
    outcome: 'You can trigger the agent through a message surface.',
    expectedResult: 'A message sent through the selected channel reaches the runtime.',
    validation: 'Send one message from the chosen channel and confirm the response arrives.',
    xp: 55,
    steps: [
      {
        title: 'Choose one channel',
        body: 'Pick the channel you already use. Shipping one real surface beats pretending to support everything.',
      },
      {
        title: 'Set the bot or webhook credentials',
        body: 'Store the minimum required credentials on the runtime host and keep them out of chat logs.',
      },
      {
        title: 'Run the message smoke test',
        body: 'Send a short ping command and confirm the agent answers in the same thread.',
      },
    ],
    troubleshooting: [
      'If the channel is silent, verify the bot token and webhook reachability before touching the agent config.',
      'If you get duplicate replies, kill the extra process before moving on.',
      'If you do not need messaging for your workflow, document the interface you chose instead.',
    ],
    nextLesson: 'add-your-first-skill',
  },
  {
    slug: 'add-your-first-skill',
    title: 'Add your first skill/tool',
    summary: 'Teach Hermes one bounded capability it can reuse.',
    level: 2,
    track: 'useful-workflow',
    estimatedMinutes: 25,
    difficulty: 'builder',
    objective: 'Install or write one skill that solves a repeatable step.',
    prerequisites: ['connect-a-messaging-layer'],
    outcome: 'A custom capability the agent can call on demand.',
    expectedResult: 'The agent uses a skill or tool to complete a concrete subtask.',
    validation: 'Trigger the skill once and capture the result.',
    xp: 70,
    milestoneEvents: ['first_skill_added'],
    steps: [
      {
        title: 'Choose one narrow capability',
        body: 'Pick a task that is frequent, low-risk, and obvious when it works.',
      },
      {
        title: 'Install or write the skill',
        body: 'Use the Hermes skill flow you already trust. Keep the scope tiny.',
      },
      {
        title: 'Call it with a real input',
        body: 'Use production-shaped input, not lorem ipsum.',
      },
    ],
    troubleshooting: [
      'If the skill fails, test the underlying command or API outside Hermes first.',
      'If output is too noisy, narrow the skill instead of adding prompt sludge.',
      'If the task is risky, put an approval gate in front of it later in Track D.',
    ],
    nextLesson: 'create-a-scheduled-workflow',
  },
  {
    slug: 'create-a-scheduled-workflow',
    title: 'Create a scheduled workflow',
    summary: 'Run the same useful job on a clock instead of by hand.',
    level: 3,
    track: 'useful-workflow',
    estimatedMinutes: 20,
    difficulty: 'builder',
    objective: 'Turn the skill into a repeatable scheduled job.',
    prerequisites: ['add-your-first-skill'],
    outcome: 'A workflow that fires without a human manually kicking it.',
    expectedResult: 'A scheduled execution fires and leaves a visible trace.',
    validation: 'Run the schedule once manually or wait for the first tick and record the result.',
    xp: 75,
    milestoneEvents: ['first_workflow_built'],
    steps: [
      {
        title: 'Pick the cadence',
        body: 'Choose a schedule that matches the job. Daily is usually enough. “Every minute” is how people DDoS themselves.',
      },
      {
        title: 'Wire the schedule',
        body: 'Use the Hermes scheduling path or host cron, but keep the command obvious and logged.',
      },
      {
        title: 'Verify one tick',
        body: 'Make sure the workflow creates output you can find later.',
      },
    ],
    troubleshooting: [
      'If the schedule never fires, verify timezone assumptions first.',
      'If it fires twice, remove the duplicate job before it gets expensive.',
      'If the job depends on secrets, confirm the scheduler environment inherits them.',
    ],
    nextLesson: 'see-your-agent-activity',
  },
  {
    slug: 'see-your-agent-activity',
    title: 'See your agent activity',
    summary: 'Open the control surface and inspect live runs instead of guessing.',
    level: 4,
    track: 'controlled-agent',
    estimatedMinutes: 20,
    difficulty: 'operator',
    objective: 'Use the MUTX control layer to inspect recent activity.',
    prerequisites: ['create-a-scheduled-workflow'],
    outcome: 'Recent runs and operational signals are visible.',
    expectedResult: 'You can see recent activity, failures, or empty-state truth from the control layer.',
    validation: 'Open the autopilot surface and verify that runs or the current empty state are visible.',
    xp: 70,
    milestoneEvents: ['first_monitoring_event_seen'],
    steps: [
      {
        title: 'Open the control view',
        body: 'Look at runs first. It is the fastest route to “what the hell happened?”.',
      },
      {
        title: 'Inspect one run',
        body: 'Read the status, timing, and output. Do not stop at the green badge.',
      },
      {
        title: 'Check alerts and budgets',
        body: 'Confirm where the system will scream before it burns time or credits.',
      },
    ],
    troubleshooting: [
      'If no runs appear, verify the agent actually executed before blaming the dashboard.',
      'If auth blocks the view, sign in before digging into API ghosts.',
      'If the surface is empty, that is still signal: it means your runtime is not feeding the control layer yet.',
    ],
    nextLesson: 'set-a-cost-threshold',
  },
  {
    slug: 'set-a-cost-threshold',
    title: 'Set a cost threshold',
    summary: 'Pick a line in the sand so cost surprises stop being a personality trait.',
    level: 5,
    track: 'controlled-agent',
    estimatedMinutes: 15,
    difficulty: 'operator',
    objective: 'Configure a threshold you are willing to tolerate before the runtime gets noisy.',
    prerequisites: ['see-your-agent-activity'],
    outcome: 'A stored threshold tied to live budget visibility.',
    expectedResult: 'The product shows a configured threshold and compares live usage against it.',
    validation: 'Save a threshold and confirm it persists on reload.',
    xp: 65,
    milestoneEvents: ['first_alert_configured'],
    steps: [
      {
        title: 'Choose the threshold',
        body: 'Pick a percentage that makes sense for your budget. Seventy to eighty percent is a sane starting point.',
      },
      {
        title: 'Save it in the control layer',
        body: 'Store the threshold so it survives reloads and can be compared with live budget usage.',
      },
      {
        title: 'Check the breach state',
        body: 'If live usage is already above the threshold, treat that as a real warning, not a UI flourish.',
      },
    ],
    troubleshooting: [
      'If the threshold does not persist, fix persistence before you trust the rest of the controls.',
      'If budget data is unavailable, treat cost awareness as degraded and keep the workflow scope tight.',
      'If you are guessing your budget, start lower.',
    ],
    nextLesson: 'add-an-approval-gate',
  },
  {
    slug: 'add-an-approval-gate',
    title: 'Add an approval gate',
    summary: 'Require a human click before one risky action goes out into the world.',
    level: 5,
    track: 'controlled-agent',
    estimatedMinutes: 20,
    difficulty: 'operator',
    objective: 'Exercise a real approval request and resolution loop.',
    prerequisites: ['set-a-cost-threshold'],
    outcome: 'A working risky-action gate.',
    expectedResult: 'A pending approval request can be created and resolved.',
    validation: 'Create one approval request, then approve or reject it.',
    xp: 75,
    milestoneEvents: ['first_approval_gate_enabled'],
    steps: [
      {
        title: 'Pick the risky action',
        body: 'Use a send, publish, or external-update action. If a mistake could annoy a customer or mutate production state, gate it.',
      },
      {
        title: 'Create one approval request',
        body: 'Push the action into the approval queue instead of executing it blindly.',
      },
      {
        title: 'Resolve it on purpose',
        body: 'Approve once, reject once, and learn what the queue looks like when reality hits.',
      },
    ],
    troubleshooting: [
      'If approvals are unavailable, do not pretend the agent is governed yet.',
      'If everybody can approve everything, your gate exists but your policy is weak.',
      'If you are gating low-risk noise, the team will learn to ignore the queue.',
    ],
    nextLesson: 'build-a-lead-response-agent',
  },
  {
    slug: 'build-a-lead-response-agent',
    title: 'Build a lead-response agent',
    summary: 'Turn an inbound lead into a drafted reply and controlled next action.',
    level: 6,
    track: 'useful-workflow',
    estimatedMinutes: 35,
    difficulty: 'builder',
    objective: 'Ship one workflow a founder would actually use.',
    prerequisites: ['add-an-approval-gate'],
    outcome: 'A lead-response agent with approval before the risky outbound step.',
    expectedResult: 'New lead data becomes a draft reply, task, or summary that can be approved before send.',
    validation: 'Run one fake or real lead through the workflow end-to-end.',
    xp: 90,
    steps: [
      {
        title: 'Define the lead input',
        body: 'Use the smallest structured payload that matters: name, source, intent, and next step.',
      },
      {
        title: 'Draft the response',
        body: 'Have Hermes create a concise first reply or a structured summary for the operator.',
      },
      {
        title: 'Gate the send',
        body: 'Do not let the agent send the risky outbound message without approval.',
      },
    ],
    troubleshooting: [
      'If the draft is too generic, tighten the input structure.',
      'If the workflow is too slow, remove nonessential steps before optimizing models.',
      'If you do not actually need outbound send yet, stop at summary and task creation.',
    ],
    nextLesson: 'build-a-document-processing-agent',
  },
  {
    slug: 'build-a-document-processing-agent',
    title: 'Build a document-processing agent',
    summary: 'Ingest a document, extract the useful bits, and surface a controlled output.',
    level: 6,
    track: 'production-pattern',
    estimatedMinutes: 40,
    difficulty: 'builder',
    objective: 'Ship a stronger production pattern around unstructured input.',
    prerequisites: ['add-an-approval-gate'],
    outcome: 'A document-processing lane with visible runs and controlled output.',
    expectedResult: 'A document is parsed, summarized, and turned into a usable artifact.',
    validation: 'Process one real document and verify the extracted output is good enough to use.',
    xp: 95,
    steps: [
      {
        title: 'Pick one document type',
        body: 'Invoices, PDFs, briefs, and support docs all count. Pick one and keep the schema boring.',
      },
      {
        title: 'Extract structured fields',
        body: 'Turn the file into the few fields that actually matter downstream.',
      },
      {
        title: 'Publish a reviewed result',
        body: 'Surface the summary, tags, or checklist through the control layer so an operator can inspect it.',
      },
    ],
    troubleshooting: [
      'If extraction quality is weak, reduce the document variety before you add more prompting.',
      'If the output is hard to inspect, your schema is too messy.',
      'If you cannot validate the output, the workflow is not ready to automate.',
    ],
  },
]

const DEFAULT_AUTOPILOT_STATE: PicoProgressState['autopilot'] = {
  costThresholdPercent: 75,
  alertChannel: 'in_app',
  approvalGateEnabled: false,
  approvalRequestIds: [],
  lastThresholdBreachAt: null,
}

export function createDefaultPicoProgress(): PicoProgressState {
  const now = new Date().toISOString()
  return {
    version: 1,
    startedAt: now,
    updatedAt: now,
    selectedTrack: null,
    startedLessons: [],
    completedLessons: [],
    milestoneEvents: [],
    tutorQuestions: 0,
    supportRequests: 0,
    helpfulResponses: 0,
    sharedProjects: [],
    autopilot: { ...DEFAULT_AUTOPILOT_STATE },
  }
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)))
}

export function normalizePicoProgress(value: Partial<PicoProgressState> | null | undefined): PicoProgressState {
  const fallback = createDefaultPicoProgress()
  const candidate = value ?? {}

  return {
    version: typeof candidate.version === 'number' ? candidate.version : fallback.version,
    startedAt:
      typeof candidate.startedAt === 'string' && candidate.startedAt.length > 0
        ? candidate.startedAt
        : fallback.startedAt,
    updatedAt:
      typeof candidate.updatedAt === 'string' && candidate.updatedAt.length > 0
        ? candidate.updatedAt
        : fallback.updatedAt,
    selectedTrack: typeof candidate.selectedTrack === 'string' ? candidate.selectedTrack : null,
    startedLessons: uniqueStrings(candidate.startedLessons),
    completedLessons: uniqueStrings(candidate.completedLessons),
    milestoneEvents: uniqueStrings(candidate.milestoneEvents),
    tutorQuestions: typeof candidate.tutorQuestions === 'number' ? candidate.tutorQuestions : 0,
    supportRequests: typeof candidate.supportRequests === 'number' ? candidate.supportRequests : 0,
    helpfulResponses: typeof candidate.helpfulResponses === 'number' ? candidate.helpfulResponses : 0,
    sharedProjects: uniqueStrings(candidate.sharedProjects),
    autopilot: {
      costThresholdPercent:
        typeof candidate.autopilot?.costThresholdPercent === 'number'
          ? Math.max(1, Math.min(100, Math.round(candidate.autopilot.costThresholdPercent)))
          : DEFAULT_AUTOPILOT_STATE.costThresholdPercent,
      alertChannel:
        candidate.autopilot?.alertChannel === 'email' || candidate.autopilot?.alertChannel === 'webhook'
          ? candidate.autopilot.alertChannel
          : 'in_app',
      approvalGateEnabled: Boolean(candidate.autopilot?.approvalGateEnabled),
      approvalRequestIds: uniqueStrings(candidate.autopilot?.approvalRequestIds),
      lastThresholdBreachAt:
        typeof candidate.autopilot?.lastThresholdBreachAt === 'string'
          ? candidate.autopilot.lastThresholdBreachAt
          : null,
    },
  }
}

export function getLessonBySlug(slug: string) {
  return PICO_LESSONS.find((lesson) => lesson.slug === slug) ?? null
}

export function getTrackBySlug(slug: string) {
  return PICO_TRACKS.find((track) => track.slug === slug) ?? null
}

export function getLessonsForTrack(trackSlug: string) {
  return PICO_LESSONS.filter((lesson) => lesson.track === trackSlug)
}

export function getLessonsForLevel(levelId: number) {
  return PICO_LESSONS.filter((lesson) => lesson.level === levelId)
}

export function derivePicoProgress(progressInput: Partial<PicoProgressState> | null | undefined): PicoDerivedProgress {
  const progress = normalizePicoProgress(progressInput)
  const completedLessons = new Set(progress.completedLessons)
  const milestoneEvents = new Set(progress.milestoneEvents)

  const unlockedLessonSlugs = PICO_LESSONS.filter((lesson) =>
    lesson.prerequisites.every((prerequisite) => completedLessons.has(prerequisite))
  ).map((lesson) => lesson.slug)

  const completedTrackSlugs = PICO_TRACKS.filter((track) =>
    track.lessons.every((lessonSlug) => completedLessons.has(lessonSlug))
  ).map((track) => track.slug)

  const unlockedTrackSlugs = PICO_TRACKS.filter((track, index) =>
    index === 0 || completedTrackSlugs.includes(PICO_TRACKS[index - 1]?.slug ?? '')
  ).map((track) => track.slug)

  const lessonXp = PICO_LESSONS.reduce(
    (total, lesson) => total + (completedLessons.has(lesson.slug) ? lesson.xp : 0),
    0
  )
  const milestoneXp = Array.from(milestoneEvents).reduce(
    (total, eventId) => total + (PICO_MILESTONE_XP[eventId] ?? 0),
    0
  )
  const trackXp = completedTrackSlugs.length * 30
  const xp = lessonXp + milestoneXp + trackXp

  const badges = PICO_BADGE_RULES.filter((rule) => rule.test(completedLessons, milestoneEvents)).map(
    (rule) => rule.label
  )

  const currentLevel = PICO_LEVELS.reduce((level, item) => {
    const levelComplete = getLessonsForLevel(item.id).every((lesson) => completedLessons.has(lesson.slug))
    return levelComplete ? item.id : level
  }, 0)

  const selectedTrackLessons = progress.selectedTrack
    ? getLessonsForTrack(progress.selectedTrack).filter(
        (lesson) => !completedLessons.has(lesson.slug) && unlockedLessonSlugs.includes(lesson.slug)
      )
    : []

  const nextLesson =
    selectedTrackLessons[0] ??
    PICO_LESSONS.find((lesson) => !completedLessons.has(lesson.slug) && unlockedLessonSlugs.includes(lesson.slug)) ??
    null

  return {
    xp,
    currentLevel,
    totalLessons: PICO_LESSONS.length,
    completedLessonCount: completedLessons.size,
    completedTrackSlugs,
    badges,
    unlockedLessonSlugs,
    unlockedTrackSlugs,
    nextLesson,
  }
}

export function mergePicoProgress(localValue: Partial<PicoProgressState> | null | undefined, remoteValue: Partial<PicoProgressState> | null | undefined) {
  const local = normalizePicoProgress(localValue)
  const remote = normalizePicoProgress(remoteValue)

  const remoteLooksEmpty =
    !remote.selectedTrack &&
    remote.startedLessons.length === 0 &&
    remote.completedLessons.length === 0 &&
    remote.milestoneEvents.length === 0 &&
    remote.sharedProjects.length === 0 &&
    remote.tutorQuestions === 0 &&
    remote.supportRequests === 0

  if (remoteLooksEmpty) {
    return local
  }

  return normalizePicoProgress({
    ...remote,
    selectedTrack: local.selectedTrack || remote.selectedTrack,
    startedLessons: Array.from(new Set([...remote.startedLessons, ...local.startedLessons])),
    completedLessons: Array.from(new Set([...remote.completedLessons, ...local.completedLessons])),
    milestoneEvents: Array.from(new Set([...remote.milestoneEvents, ...local.milestoneEvents])),
    sharedProjects: Array.from(new Set([...remote.sharedProjects, ...local.sharedProjects])),
    tutorQuestions: Math.max(remote.tutorQuestions, local.tutorQuestions),
    supportRequests: Math.max(remote.supportRequests, local.supportRequests),
    helpfulResponses: Math.max(remote.helpfulResponses, local.helpfulResponses),
    autopilot: {
      ...remote.autopilot,
      ...local.autopilot,
      approvalRequestIds: Array.from(
        new Set([...remote.autopilot.approvalRequestIds, ...local.autopilot.approvalRequestIds])
      ),
      lastThresholdBreachAt:
        remote.autopilot.lastThresholdBreachAt || local.autopilot.lastThresholdBreachAt || null,
    },
    updatedAt:
      new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime()
        ? remote.updatedAt
        : local.updatedAt,
  })
}

export function applyLessonStarted(progressInput: Partial<PicoProgressState>, lessonSlug: string): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  const next = normalizePicoProgress({
    ...progress,
    startedLessons: Array.from(new Set([...progress.startedLessons, lessonSlug])),
    milestoneEvents: Array.from(
      new Set([
        ...progress.milestoneEvents,
        ...(progress.startedLessons.length === 0 ? ['first_tutorial_started'] : []),
      ])
    ),
    updatedAt: new Date().toISOString(),
  })
  return next
}

export function applyLessonCompleted(progressInput: Partial<PicoProgressState>, lessonSlug: string): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  const lesson = getLessonBySlug(lessonSlug)
  if (!lesson) {
    return progress
  }

  const milestoneEvents = new Set(progress.milestoneEvents)
  if (progress.completedLessons.length === 0) {
    milestoneEvents.add('first_tutorial_completed')
  }
  for (const eventId of lesson.milestoneEvents ?? []) {
    milestoneEvents.add(eventId)
  }

  return normalizePicoProgress({
    ...progress,
    startedLessons: Array.from(new Set([...progress.startedLessons, lessonSlug])),
    completedLessons: Array.from(new Set([...progress.completedLessons, lessonSlug])),
    milestoneEvents: Array.from(milestoneEvents),
    updatedAt: new Date().toISOString(),
  })
}

export function applyMilestone(progressInput: Partial<PicoProgressState>, eventId: string): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  return normalizePicoProgress({
    ...progress,
    milestoneEvents: Array.from(new Set([...progress.milestoneEvents, eventId])),
    updatedAt: new Date().toISOString(),
  })
}

export function updateAutopilotSettings(
  progressInput: Partial<PicoProgressState>,
  autopilotPatch: Partial<PicoProgressState['autopilot']>
): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  return normalizePicoProgress({
    ...progress,
    autopilot: {
      ...progress.autopilot,
      ...autopilotPatch,
    },
    updatedAt: new Date().toISOString(),
  })
}

export function selectTrack(progressInput: Partial<PicoProgressState>, trackSlug: string): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  return normalizePicoProgress({
    ...progress,
    selectedTrack: trackSlug,
    updatedAt: new Date().toISOString(),
  })
}

export function markTutorQuestion(progressInput: Partial<PicoProgressState>): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  return normalizePicoProgress({
    ...progress,
    tutorQuestions: progress.tutorQuestions + 1,
    updatedAt: new Date().toISOString(),
  })
}

export function markSupportRequest(progressInput: Partial<PicoProgressState>): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  return normalizePicoProgress({
    ...progress,
    supportRequests: progress.supportRequests + 1,
    updatedAt: new Date().toISOString(),
  })
}

export function markProjectShared(progressInput: Partial<PicoProgressState>, projectId: string): PicoProgressState {
  const progress = normalizePicoProgress(progressInput)
  const next = normalizePicoProgress({
    ...progress,
    sharedProjects: Array.from(new Set([...progress.sharedProjects, projectId])),
    milestoneEvents: Array.from(new Set([...progress.milestoneEvents, 'project_shared'])),
    updatedAt: new Date().toISOString(),
  })
  return next
}

export function searchLessonCorpus(query: string) {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)

  if (tokens.length === 0) {
    return PICO_LESSONS.slice(0, 3).map((lesson, index) => ({ lesson, score: 3 - index }))
  }

  return PICO_LESSONS.map((lesson) => {
    const haystack = [
      lesson.title,
      lesson.summary,
      lesson.objective,
      lesson.outcome,
      lesson.expectedResult,
      lesson.validation,
      ...lesson.troubleshooting,
      ...lesson.steps.map((step) => `${step.title} ${step.body} ${step.command ?? ''}`),
    ]
      .join(' ')
      .toLowerCase()

    let score = 0
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2
      if (lesson.title.toLowerCase().includes(token)) score += 2
      if (lesson.slug.includes(token)) score += 1
    }
    return { lesson, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}
