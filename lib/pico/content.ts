export type PicoLevel = {
  id: number
  title: string
  objective: string
  prerequisites: string[]
  projectOutcome: string
  completionState: string
  xpReward: number
  badge: string
  nextStep: string
}

export type PicoTrack = {
  id: 'track-a' | 'track-b' | 'track-c' | 'track-d' | 'track-e'
  title: string
  outcome: string
  intro: string
  checklist: string[]
  nextRecommendedPath: string
}

export type PicoLesson = {
  id: string
  title: string
  shortTitle: string
  levelId: number
  trackId: PicoTrack['id']
  objective: string
  prerequisites: string[]
  expectedResult: string
  validationStep: string
  troubleshooting: string[]
  steps: string[]
  artifact: string
  duration: string
  xpReward: number
}

export const PICO_LEVELS: PicoLevel[] = [
  {
    id: 0,
    title: 'Setup',
    objective: 'Install Hermes, run the CLI, and verify your first working response.',
    prerequisites: ['A machine with terminal access and one model provider available.'],
    projectOutcome: 'A local Hermes install with one working agent session.',
    completionState: 'Hermes responds locally and your first workspace is live.',
    xpReward: 120,
    badge: 'Boot Sequence',
    nextStep: 'Deploy that agent somewhere it survives beyond your laptop session.',
  },
  {
    id: 1,
    title: 'Deployment',
    objective: 'Move the agent to a persistent environment and keep it reachable.',
    prerequisites: ['Level 0 complete.'],
    projectOutcome: 'A deployed Hermes runtime with a stable interface path.',
    completionState: 'Your agent stays alive between sessions.',
    xpReward: 150,
    badge: 'Ship It',
    nextStep: 'Teach the agent one real capability that matters.',
  },
  {
    id: 2,
    title: 'Capability',
    objective: 'Add a skill or tool and make the agent complete a useful task.',
    prerequisites: ['Level 1 complete.'],
    projectOutcome: 'A single-purpose agent that does something worth repeating.',
    completionState: 'The agent produces one useful output on demand.',
    xpReward: 180,
    badge: 'Toolsmith',
    nextStep: 'Automate the capability so it runs without babysitting.',
  },
  {
    id: 3,
    title: 'Automation',
    objective: 'Schedule repeated runs and create a small workflow loop.',
    prerequisites: ['Level 2 complete.'],
    projectOutcome: 'A cron-driven workflow with one clear trigger and one useful output.',
    completionState: 'Your agent runs on a schedule without manual prompting.',
    xpReward: 210,
    badge: 'Workflow Builder',
    nextStep: 'Add visibility so failures stop being invisible.',
  },
  {
    id: 4,
    title: 'Production',
    objective: 'Add logs, monitoring, and runtime visibility.',
    prerequisites: ['Level 3 complete.'],
    projectOutcome: 'A visible agent with activity history and failure signals.',
    completionState: 'You can tell what the agent did and when it broke.',
    xpReward: 240,
    badge: 'Watchtower',
    nextStep: 'Control cost and risky actions instead of trusting blindly.',
  },
  {
    id: 5,
    title: 'Control',
    objective: 'Add cost awareness, alerts, and approval gates.',
    prerequisites: ['Level 4 complete.'],
    projectOutcome: 'A governed agent with thresholds and approvals.',
    completionState: 'Risky actions and runaway costs are no longer silent.',
    xpReward: 270,
    badge: 'Control Loop',
    nextStep: 'Apply the pattern to a real production workflow.',
  },
  {
    id: 6,
    title: 'Systems',
    objective: 'Package the whole thing into reusable production patterns.',
    prerequisites: ['Level 5 complete.'],
    projectOutcome: 'A production-ready agent pattern you can reuse or share.',
    completionState: 'You have one agent pattern you trust enough to run for real work.',
    xpReward: 320,
    badge: 'Pattern Operator',
    nextStep: 'Turn the pattern into your next agent or move deeper into MUTX.',
  },
]

export const PICO_TRACKS: PicoTrack[] = [
  {
    id: 'track-a',
    title: 'First Agent',
    outcome: 'Hermes is running and responds to input.',
    intro: 'Get from zero to a live local agent fast. No theory theater.',
    checklist: [
      'Hermes installed',
      'First session opened',
      'First response verified',
    ],
    nextRecommendedPath: 'Track B — Deployed Agent',
  },
  {
    id: 'track-b',
    title: 'Deployed Agent',
    outcome: 'A persistent Hermes runtime survives beyond your laptop session.',
    intro: 'Turn a local agent into a service you can actually keep alive.',
    checklist: [
      'VPS or persistent host selected',
      'Runtime deployed',
      'Interface connected',
    ],
    nextRecommendedPath: 'Track C — Useful Workflow',
  },
  {
    id: 'track-c',
    title: 'Useful Workflow',
    outcome: 'The agent performs a concrete repeated task.',
    intro: 'Add one skill, one workflow, and one reason to keep the agent around.',
    checklist: [
      'First skill added',
      'Workflow created',
      'One useful task completed',
    ],
    nextRecommendedPath: 'Track D — Controlled Agent',
  },
  {
    id: 'track-d',
    title: 'Controlled Agent',
    outcome: 'The agent is visible, budget-aware, and governed.',
    intro: 'This is where agent ops starts being real instead of vibes.',
    checklist: [
      'Activity visible',
      'Budget threshold configured',
      'Approval gate enabled',
    ],
    nextRecommendedPath: 'Track E — Production Pattern',
  },
  {
    id: 'track-e',
    title: 'Production Pattern',
    outcome: 'A reusable real-world agent pattern is documented and ready to rerun.',
    intro: 'Wrap the learning into something you can deploy again without rethinking it.',
    checklist: [
      'A lead-response agent completed',
      'A document-processing agent completed',
      'Pattern notes exported',
    ],
    nextRecommendedPath: 'Deeper MUTX control-plane workflows',
  },
]

export const PICO_LESSONS: PicoLesson[] = [
  {
    id: 'install-hermes-locally',
    title: 'Install Hermes locally',
    shortTitle: 'Install Hermes',
    levelId: 0,
    trackId: 'track-a',
    objective: 'Install Hermes on your local machine and confirm the binary works.',
    prerequisites: ['Terminal access', 'Python or packaged Hermes install path chosen'],
    expectedResult: 'The hermes command runs locally and shows the CLI prompt.',
    validationStep: 'Run hermes and confirm you can enter a prompt without an install error.',
    troubleshooting: [
      'If hermes is not found, reopen your shell and confirm the install path is on PATH.',
      'If Python tooling is missing, use the packaged installer instead of fighting your environment.',
      'If models are unavailable, finish install first and bind a provider in the next lesson.',
    ],
    steps: [
      'Choose your install path: packaged build or Python environment.',
      'Install Hermes using the current project-approved path for your OS.',
      'Run hermes --help to confirm the binary resolves cleanly.',
      'Open the CLI once and verify the prompt starts without stack traces.',
    ],
    artifact: 'A working local Hermes runtime.',
    duration: '15 min',
    xpReward: 40,
  },
  {
    id: 'run-first-agent',
    title: 'Run your first agent',
    shortTitle: 'First agent run',
    levelId: 0,
    trackId: 'track-a',
    objective: 'Start a real session and verify the agent answers a useful prompt.',
    prerequisites: ['Install Hermes locally'],
    expectedResult: 'One verified agent response and a named first project workspace.',
    validationStep: 'Ask the agent to complete a concrete task and save the working prompt you used.',
    troubleshooting: [
      'If no model responds, confirm your provider credentials before changing prompts.',
      'If the answer is weak, simplify the task instead of adding prompt sludge.',
      'If the session crashes, restart cleanly and test with one short prompt first.',
    ],
    steps: [
      'Open Hermes and bind one working model provider.',
      'Create a first task prompt that produces a concrete output: summary, plan, or code snippet.',
      'Save the exact prompt that worked so it becomes your first reusable run.',
      'Record the project name you want PicoMUTX to track.',
    ],
    artifact: 'A saved first prompt and first successful response.',
    duration: '20 min',
    xpReward: 80,
  },
  {
    id: 'deploy-hermes-vps',
    title: 'Deploy Hermes on a VPS',
    shortTitle: 'Deploy on VPS',
    levelId: 1,
    trackId: 'track-b',
    objective: 'Move the working agent onto a persistent host.',
    prerequisites: ['Run your first agent'],
    expectedResult: 'Hermes runs on a VPS or persistent environment you control.',
    validationStep: 'SSH into the host, start Hermes there, and verify the process survives disconnect.',
    troubleshooting: [
      'If install differs from local, pin the exact install path instead of improvising.',
      'If the host dies after disconnect, wrap Hermes in a process manager.',
      'If networking blocks you, keep the runtime private first and add interfaces later.',
    ],
    steps: [
      'Provision a small persistent host with SSH access.',
      'Install Hermes on the host using the same known-good version path from local setup.',
      'Copy only the minimal config and credentials needed to run.',
      'Start Hermes remotely and verify the service stays available after you disconnect.',
    ],
    artifact: 'A persistent Hermes runtime on a server.',
    duration: '35 min',
    xpReward: 70,
  },
  {
    id: 'keep-agent-alive',
    title: 'Keep your agent alive between sessions',
    shortTitle: 'Keep it alive',
    levelId: 1,
    trackId: 'track-b',
    objective: 'Wrap the runtime in a process manager so it does not die silently.',
    prerequisites: ['Deploy Hermes on a VPS'],
    expectedResult: 'Hermes restarts cleanly and stays alive without manual babysitting.',
    validationStep: 'Restart the host or the service and confirm the agent comes back without manual repair.',
    troubleshooting: [
      'If startup depends on shell state, move that into the service command.',
      'If logs vanish, write them to a known file path.',
      'If environment variables are missing, make the process manager own them explicitly.',
    ],
    steps: [
      'Choose a process manager: systemd, pm2, supervisor, or your platform equivalent.',
      'Create a service definition that starts Hermes with the exact working command.',
      'Enable restart on failure and capture stdout or logs.',
      'Simulate a crash or restart and verify the runtime comes back cleanly.',
    ],
    artifact: 'A repeatable keep-alive service definition.',
    duration: '25 min',
    xpReward: 80,
  },
  {
    id: 'connect-interface-layer',
    title: 'Connect a messaging or interface layer',
    shortTitle: 'Connect interface',
    levelId: 1,
    trackId: 'track-b',
    objective: 'Give the agent one practical way to receive tasks outside the terminal.',
    prerequisites: ['Keep your agent alive between sessions'],
    expectedResult: 'A messaging or interface surface is connected and documented.',
    validationStep: 'Send one real message through the interface and confirm the agent handles it.',
    troubleshooting: [
      'If credentials fail, validate them in isolation before blaming Hermes.',
      'If messages arrive twice, check webhook retries or polling overlap.',
      'If latency is bad, reduce prompt size before touching infrastructure.',
    ],
    steps: [
      'Pick one interface only: Telegram, Discord, Slack, email, or a simple webhook.',
      'Create or provision the credentials for that interface.',
      'Bind the interface to Hermes and document the exact channel or endpoint.',
      'Send a live message and capture the first successful exchange.',
    ],
    artifact: 'One working interface route into the agent.',
    duration: '30 min',
    xpReward: 90,
  },
  {
    id: 'add-first-skill-tool',
    title: 'Add your first skill or tool',
    shortTitle: 'Add skill',
    levelId: 2,
    trackId: 'track-c',
    objective: 'Teach the agent one capability beyond vanilla chat.',
    prerequisites: ['Connect a messaging or interface layer'],
    expectedResult: 'The agent completes one capability-assisted task.',
    validationStep: 'Use the added skill or tool in a real run and save the successful output.',
    troubleshooting: [
      'If the skill is too broad, narrow it to one outcome instead of a vague helper.',
      'If the agent ignores the tool, tighten the prompt and make the task tool-dependent.',
      'If the capability is brittle, add one validation step before declaring victory.',
    ],
    steps: [
      'Choose one real capability: file lookup, webhook call, document parsing, or status reporting.',
      'Add the skill or tool configuration to your Hermes setup.',
      'Write one prompt that clearly requires the capability.',
      'Save the first successful output and note where it failed before it worked.',
    ],
    artifact: 'A documented first skill with one working task example.',
    duration: '30 min',
    xpReward: 100,
  },
  {
    id: 'create-scheduled-workflow',
    title: 'Create a scheduled workflow',
    shortTitle: 'Scheduled workflow',
    levelId: 3,
    trackId: 'track-c',
    objective: 'Run the agent on a schedule instead of waiting for manual prompts.',
    prerequisites: ['Add your first skill or tool'],
    expectedResult: 'A cron or scheduled workflow runs and produces a repeatable output.',
    validationStep: 'Trigger one scheduled run and verify the output lands where you expect.',
    troubleshooting: [
      'If the schedule never fires, test the exact command outside cron first.',
      'If context is missing, make the scheduled prompt fully self-contained.',
      'If notifications are noisy, reduce frequency before adding more logic.',
    ],
    steps: [
      'Choose one repeated job worth automating: leads, docs, summaries, or checks.',
      'Create a scheduled prompt that is fully self-contained.',
      'Add the schedule via Hermes cron or your host scheduler.',
      'Run one manual dry run, then confirm one scheduled execution completes.',
    ],
    artifact: 'A working scheduled workflow.',
    duration: '25 min',
    xpReward: 110,
  },
  {
    id: 'see-agent-activity',
    title: 'See your agent activity',
    shortTitle: 'See activity',
    levelId: 4,
    trackId: 'track-d',
    objective: 'Create a readable activity trail so you know what the agent did.',
    prerequisites: ['Create a scheduled workflow'],
    expectedResult: 'You can review recent runs, failures, and status changes.',
    validationStep: 'Capture one successful event and one failure or warning in your activity trail.',
    troubleshooting: [
      'If everything is silent, log less magic and more concrete state changes.',
      'If failures are unreadable, summarize them in plain English next to raw logs.',
      'If activity is too noisy, group events by run or workflow.',
    ],
    steps: [
      'Pick one activity view: log file, timeline, observability page, or PicoMUTX manual telemetry.',
      'Record run start, run finish, and error events consistently.',
      'Make sure the last successful run time is visible.',
      'Review the timeline and cut anything that is noise instead of signal.',
    ],
    artifact: 'A readable run timeline.',
    duration: '20 min',
    xpReward: 120,
  },
  {
    id: 'set-cost-threshold',
    title: 'Set a cost threshold',
    shortTitle: 'Set threshold',
    levelId: 5,
    trackId: 'track-d',
    objective: 'Define a budget ceiling before costs start freelancing.',
    prerequisites: ['See your agent activity'],
    expectedResult: 'A budget threshold is visible and alertable.',
    validationStep: 'Set a monthly threshold and confirm a warning appears when usage crosses it.',
    troubleshooting: [
      'If you do not have exact cost data yet, start with conservative estimates and tighten later.',
      'If the threshold is too high to matter, lower it until it would force a decision.',
      'If alerts are spammy, add severity bands instead of removing the threshold.',
    ],
    steps: [
      'Choose a monthly cost cap you are actually willing to pay.',
      'Track cost per run or per day in the simplest honest way available.',
      'Set a warning threshold below the hard cap.',
      'Trigger one test event so you know the warning path works.',
    ],
    artifact: 'A visible budget threshold with one tested warning path.',
    duration: '15 min',
    xpReward: 130,
  },
  {
    id: 'add-approval-gate',
    title: 'Add an approval gate',
    shortTitle: 'Approval gate',
    levelId: 5,
    trackId: 'track-d',
    objective: 'Require a human yes before risky actions go out into the world.',
    prerequisites: ['Set a cost threshold'],
    expectedResult: 'At least one risky action pauses for human approval.',
    validationStep: 'Queue one risky action, approve it once, and deny it once.',
    troubleshooting: [
      'If everything needs approval, your gate is too broad.',
      'If nothing needs approval, you are kidding yourself about risk.',
      'If approvals are slow, make the request payload smaller and clearer.',
    ],
    steps: [
      'Define one risky action class: outbound message, purchase, deletion, or credential change.',
      'Route that action through an approval queue instead of sending it directly.',
      'Make approve and deny outcomes visible in your event trail.',
      'Test both approve and deny so the behavior is obvious.',
    ],
    artifact: 'One live approval gate with a tested decision trail.',
    duration: '20 min',
    xpReward: 140,
  },
  {
    id: 'build-lead-response-agent',
    title: 'Build a lead-response agent',
    shortTitle: 'Lead-response agent',
    levelId: 6,
    trackId: 'track-e',
    objective: 'Package a concrete inbound workflow into a reusable agent pattern.',
    prerequisites: ['Add an approval gate'],
    expectedResult: 'A lead-response agent captures, triages, and drafts the next action.',
    validationStep: 'Run one sample lead through the workflow and verify the draft response and approval gate.',
    troubleshooting: [
      'If triage is sloppy, tighten your lead categories and response templates.',
      'If response quality drifts, make the prompt shorter and more example-driven.',
      'If it fires too early, move outbound sending behind the approval gate.',
    ],
    steps: [
      'Choose one inbound lead source and define the expected fields.',
      'Draft the triage prompt and the response template.',
      'Log every lead event from capture to draft response.',
      'Require approval before any outbound message is sent.',
    ],
    artifact: 'A reusable lead-response workflow pattern.',
    duration: '35 min',
    xpReward: 150,
  },
  {
    id: 'build-document-processing-agent',
    title: 'Build a document-processing agent',
    shortTitle: 'Document-processing agent',
    levelId: 6,
    trackId: 'track-e',
    objective: 'Create a document workflow that extracts, classifies, and routes output safely.',
    prerequisites: ['Build a lead-response agent'],
    expectedResult: 'A document-processing agent turns incoming files into structured output.',
    validationStep: 'Process one sample document end-to-end and verify the extracted result and audit trail.',
    troubleshooting: [
      'If extraction quality is poor, limit the document type before broadening scope.',
      'If the output is hard to trust, add a human review checkpoint for low-confidence cases.',
      'If routing is messy, standardize the final output schema before scaling.',
    ],
    steps: [
      'Pick one document type only: invoice, contract, resume, or support file.',
      'Define the exact fields you need extracted.',
      'Create the classification and extraction path with one fallback for uncertain cases.',
      'Log the result, confidence, and final destination of the output.',
    ],
    artifact: 'A reusable document-processing workflow pattern.',
    duration: '40 min',
    xpReward: 170,
  },
]

export const PICO_LESSON_MAP = Object.fromEntries(PICO_LESSONS.map((lesson) => [lesson.id, lesson]))
export const PICO_TRACK_MAP = Object.fromEntries(PICO_TRACKS.map((track) => [track.id, track]))

export function getLessonsForLevel(levelId: number) {
  return PICO_LESSONS.filter((lesson) => lesson.levelId === levelId)
}

export function getLessonsForTrack(trackId: PicoTrack['id']) {
  return PICO_LESSONS.filter((lesson) => lesson.trackId === trackId)
}
