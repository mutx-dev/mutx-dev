export type PicoLevel = {
  id: string;
  title: string;
  summary: string;
  order: number;
  focus: string;
  xpReward: number;
  badge: string;
};

export type PicoTrack = {
  id: string;
  title: string;
  summary: string;
  outcome: string;
  color: string;
};

export type PicoLessonStep = {
  title: string;
  body: string;
  command?: string;
  expected?: string;
};

export type PicoTroubleshootingItem = {
  symptom: string;
  cause: string;
  fix: string;
};

export type PicoLesson = {
  slug: string;
  title: string;
  summary: string;
  objective: string;
  prerequisites: string[];
  deliverable: string;
  durationMinutes: number;
  levelId: string;
  trackId: string;
  tags: string[];
  projectOutcome: string;
  xpReward: number;
  badge: string;
  nextLessonSlug?: string;
  steps: PicoLessonStep[];
  validation: {
    checklist: string[];
    doneLooksLike: string;
  };
  troubleshooting: PicoTroubleshootingItem[];
  support: {
    prompt: string;
    escalation: string;
  };
};

function lesson(config: PicoLesson): PicoLesson {
  return config;
}

export const picoLevels: PicoLevel[] = [
  {
    id: 'level-0',
    title: 'Level 0 - Setup',
    summary: 'Install Hermes, prove it runs, and remove the first mile of friction.',
    order: 0,
    focus: 'Local install, first response, clean baseline.',
    xpReward: 100,
    badge: 'first-boot',
  },
  {
    id: 'level-1',
    title: 'Level 1 - Deployment',
    summary: 'Move from local toy to a persistent runtime you can reach again tomorrow.',
    order: 1,
    focus: 'VPS deploy, persistence, interface wiring.',
    xpReward: 140,
    badge: 'deployed',
  },
  {
    id: 'level-2',
    title: 'Level 2 - Capability',
    summary: 'Add one real capability so the agent can do useful work instead of chatting beautifully.',
    order: 2,
    focus: 'Skills, tools, scoped behavior.',
    xpReward: 80,
    badge: 'capable',
  },
  {
    id: 'level-3',
    title: 'Level 3 - Automation',
    summary: 'Turn one useful behavior into a repeatable workflow.',
    order: 3,
    focus: 'Scheduling, repetition, handoff discipline.',
    xpReward: 100,
    badge: 'automation-online',
  },
  {
    id: 'level-4',
    title: 'Level 4 - Production',
    summary: 'See what the runtime is doing before it embarrasses you.',
    order: 4,
    focus: 'Activity, logs, failure visibility, operator awareness.',
    xpReward: 60,
    badge: 'operator-aware',
  },
  {
    id: 'level-5',
    title: 'Level 5 - Control',
    summary: 'Add budgets, alerts, and approval gates so you stop babysitting blindly.',
    order: 5,
    focus: 'Thresholds, alerts, approvals, trust.',
    xpReward: 160,
    badge: 'guarded',
  },
  {
    id: 'level-6',
    title: 'Level 6 - Systems',
    summary: 'Package the work into reusable production patterns with a real business outcome.',
    order: 6,
    focus: 'Lead handling, document processing, reusable patterns.',
    xpReward: 200,
    badge: 'production-ready',
  },
];

export const picoTracks: PicoTrack[] = [
  {
    id: 'track-a',
    title: 'Track A - First Agent',
    summary: 'Go from zero to a working Hermes run on your own machine.',
    outcome: 'Hermes is installed and responds to input.',
    color: 'from-cyan-400/30 to-sky-500/10',
  },
  {
    id: 'track-b',
    title: 'Track B - Deployed Agent',
    summary: 'Move the agent into a persistent environment and keep it reachable.',
    outcome: 'The agent runs in a persistent environment with an interface layer.',
    color: 'from-emerald-400/30 to-teal-500/10',
  },
  {
    id: 'track-c',
    title: 'Track C - Useful Workflow',
    summary: 'Teach the runtime one useful behavior and schedule it.',
    outcome: 'A concrete task runs through a skill and a scheduled workflow.',
    color: 'from-violet-400/30 to-fuchsia-500/10',
  },
  {
    id: 'track-d',
    title: 'Track D - Controlled Agent',
    summary: 'See live activity, define limits, and add a human checkpoint.',
    outcome: 'The runtime is monitored and governed.',
    color: 'from-amber-400/30 to-orange-500/10',
  },
  {
    id: 'track-e',
    title: 'Track E - Production Pattern',
    summary: 'Turn the basics into reusable business workflows.',
    outcome: 'A serious pattern is running with clear operational ownership.',
    color: 'from-rose-400/30 to-pink-500/10',
  },
];

export const picoLessons: PicoLesson[] = [
  lesson({
    slug: 'install-hermes-locally',
    title: '1. Install Hermes locally',
    summary: 'Get the runtime installed cleanly so every later lesson starts from a real environment, not wishful thinking.',
    objective: 'Install Hermes and verify the binary is available from your shell.',
    prerequisites: ['A supported local machine', 'Terminal access'],
    deliverable: 'A working Hermes install visible from the terminal.',
    durationMinutes: 15,
    levelId: 'level-0',
    trackId: 'track-a',
    tags: ['install', 'hermes', 'local', 'setup'],
    projectOutcome: 'You can run the Hermes CLI locally.',
    xpReward: 50,
    badge: 'first-boot',
    nextLessonSlug: 'run-your-first-agent',
    steps: [
      {
        title: 'Install the runtime',
        body: 'Use the MUTX-approved Hermes install path and keep the install log if anything fails.',
        command: 'curl -fsSL https://mutx.dev/install.sh | bash',
        expected: 'The installer finishes without a shell-level error.',
      },
      {
        title: 'Reload your shell',
        body: 'Refresh the PATH so the binary is actually available in the current session.',
        command: 'exec "$SHELL" -l',
        expected: 'New shell session opens with the updated PATH.',
      },
      {
        title: 'Verify the binary',
        body: 'Confirm the runtime exists before touching tutorials that depend on it.',
        command: 'hermes --help',
        expected: 'Help output prints instead of command not found.',
      },
    ],
    validation: {
      checklist: [
        'The Hermes binary resolves from the shell.',
        'Help output prints without a traceback.',
        'You know which shell init file or installer path changed the environment.',
      ],
      doneLooksLike: 'The terminal prints Hermes help output and the install path is no longer ambiguous.',
    },
    troubleshooting: [
      {
        symptom: 'Command not found after install.',
        cause: 'Your shell PATH did not reload or the installer wrote to a shell profile not yet sourced.',
        fix: 'Open a new login shell and rerun hermes --help before doing anything else.',
      },
      {
        symptom: 'Install script stops early.',
        cause: 'A missing dependency or permission issue interrupted the bootstrap.',
        fix: 'Keep the failing command, install the missing dependency, then rerun the installer cleanly.',
      },
    ],
    support: {
      prompt: 'Hermes install failed locally. Help me identify the shell or dependency issue.',
      escalation: 'Escalate if the machine cannot run the installer or if the runtime fails before the first command output.',
    },
  }),
  lesson({
    slug: 'run-your-first-agent',
    title: '2. Run your first agent',
    summary: 'Prove the runtime can take input and return a useful response before you touch deployment.',
    objective: 'Run a first Hermes interaction and confirm the loop is alive.',
    prerequisites: ['Hermes installed locally'],
    deliverable: 'A captured first agent response.',
    durationMinutes: 12,
    levelId: 'level-0',
    trackId: 'track-a',
    tags: ['first run', 'prompt', 'response', 'verify'],
    projectOutcome: 'Hermes accepts input and returns a response you can inspect.',
    xpReward: 50,
    badge: 'first-boot',
    nextLessonSlug: 'deploy-hermes-on-a-vps',
    steps: [
      {
        title: 'Start with a tiny prompt',
        body: 'Use a short prompt so failure is obvious and output is easy to verify.',
        command: 'hermes "Say hello and summarize what tools you have available."',
        expected: 'Hermes prints a response instead of exiting immediately.',
      },
      {
        title: 'Save the output',
        body: 'Treat the first good response as an artifact. You are proving the runtime works, not vibes-checking it.',
        expected: 'You can copy the response into notes or a repo artifact.',
      },
      {
        title: 'Identify the next bottleneck',
        body: 'Decide whether your next problem is environment, credentials, deployment, or workflow shape.',
        expected: 'You can name the next concrete step instead of guessing.',
      },
    ],
    validation: {
      checklist: [
        'A first response exists and can be quoted back.',
        'The runtime stayed alive long enough to complete the prompt.',
        'The next blocker is clear and specific.',
      ],
      doneLooksLike: 'You have a first successful Hermes run and a captured proof artifact.',
    },
    troubleshooting: [
      {
        symptom: 'The command returns nothing useful.',
        cause: 'The runtime launched but the model path, provider config, or prompt loop is not working.',
        fix: 'Reduce the prompt, confirm provider setup, and rerun until the baseline response is visible.',
      },
      {
        symptom: 'The process exits instantly.',
        cause: 'A configuration error is preventing normal startup.',
        fix: 'Check the terminal error, fix the config, and rerun the same minimal prompt.',
      },
    ],
    support: {
      prompt: 'My first Hermes run is not producing a clean response. Help me get the baseline loop working.',
      escalation: 'Escalate if the runtime cannot complete a trivial prompt after install and config verification.',
    },
  }),
  lesson({
    slug: 'deploy-hermes-on-a-vps',
    title: '3. Deploy Hermes on a VPS',
    summary: 'Move off the laptop and into a persistent machine so the agent can survive beyond your current shell.',
    objective: 'Deploy Hermes onto a VPS or persistent host and verify remote access.',
    prerequisites: ['Hermes runs locally', 'You have a VPS or persistent environment'],
    deliverable: 'A remote host with Hermes installed and reachable.',
    durationMinutes: 25,
    levelId: 'level-1',
    trackId: 'track-b',
    tags: ['deploy', 'vps', 'remote', 'persistent'],
    projectOutcome: 'Hermes is reachable on a remote host you control.',
    xpReward: 60,
    badge: 'deployed',
    nextLessonSlug: 'keep-your-agent-alive-between-sessions',
    steps: [
      {
        title: 'Prepare the server',
        body: 'Use a small but persistent Linux host and update the system before install.',
        command: 'ssh user@your-vps && sudo apt update && sudo apt upgrade -y',
        expected: 'The server is reachable and updated.',
      },
      {
        title: 'Install Hermes remotely',
        body: 'Use the same install path on the remote machine so local and remote procedures do not drift.',
        command: 'curl -fsSL https://mutx.dev/install.sh | bash',
        expected: 'Hermes installs successfully on the remote host.',
      },
      {
        title: 'Verify remote execution',
        body: 'Run a minimal command on the server and record the result.',
        command: 'hermes --help',
        expected: 'The remote host prints Hermes help output.',
      },
    ],
    validation: {
      checklist: [
        'You can SSH into the remote host.',
        'Hermes is installed on the VPS.',
        'A remote Hermes command completes successfully.',
      ],
      doneLooksLike: 'The agent runtime no longer depends on your laptop being open.',
    },
    troubleshooting: [
      {
        symptom: 'Remote install works locally but not on the VPS.',
        cause: 'The server image is missing required packages or shell tooling.',
        fix: 'Install the missing system dependencies, rerun the install, and keep the exact package list noted.',
      },
      {
        symptom: 'SSH works but Hermes commands fail remotely.',
        cause: 'The remote shell environment does not include the runtime path or config.',
        fix: 'Reload the shell, verify PATH, and rerun hermes --help on the remote host.',
      },
    ],
    support: {
      prompt: 'Help me deploy Hermes cleanly on a VPS and verify the remote baseline.',
      escalation: 'Escalate if the persistent environment is blocked by networking, package, or system-level constraints you cannot change.',
    },
  }),
  lesson({
    slug: 'keep-your-agent-alive-between-sessions',
    title: '4. Keep your agent alive between sessions',
    summary: 'Make the runtime survive disconnects so the next operator session starts from reality, not from scratch.',
    objective: 'Set up a process supervisor or persistent session strategy.',
    prerequisites: ['Hermes deployed on a VPS'],
    deliverable: 'A process that remains alive after you disconnect.',
    durationMinutes: 18,
    levelId: 'level-1',
    trackId: 'track-b',
    tags: ['persistence', 'tmux', 'systemd', 'supervisor'],
    projectOutcome: 'The agent process survives terminal disconnects and restarts cleanly.',
    xpReward: 40,
    badge: 'deployed',
    nextLessonSlug: 'connect-a-messaging-or-interface-layer',
    steps: [
      {
        title: 'Choose a persistence strategy',
        body: 'Pick tmux for fast iteration or a service manager for a cleaner long-running lane.',
        expected: 'You know whether you are using a session manager or a service.',
      },
      {
        title: 'Start Hermes inside the persistent lane',
        body: 'Run the agent from inside the managed session so disconnects do not kill it.',
        expected: 'The process keeps running after you close the SSH session.',
      },
      {
        title: 'Reattach and verify',
        body: 'Reconnect later and prove the session or service is still live.',
        expected: 'You can reattach or inspect status without relaunching everything.',
      },
    ],
    validation: {
      checklist: [
        'The agent survives a disconnect.',
        'You can reattach or inspect status later.',
        'You know how to stop and restart the process intentionally.',
      ],
      doneLooksLike: 'The runtime keeps working when your shell goes away.',
    },
    troubleshooting: [
      {
        symptom: 'The process dies when SSH closes.',
        cause: 'Hermes was launched in a transient shell instead of a managed session.',
        fix: 'Move the launch into tmux, screen, or a system service and retest the disconnect.',
      },
      {
        symptom: 'You cannot tell whether the agent is still running.',
        cause: 'There is no repeatable inspection command or service status path.',
        fix: 'Add one status command to your notes before continuing.',
      },
    ],
    support: {
      prompt: 'Help me keep the agent alive between SSH sessions without guessing.',
      escalation: 'Escalate if the host policy blocks session managers or service control entirely.',
    },
  }),
  lesson({
    slug: 'connect-a-messaging-or-interface-layer',
    title: '5. Connect a messaging or interface layer',
    summary: 'Give the agent a real surface so it can receive work from somewhere other than your terminal.',
    objective: 'Wire one simple interface layer and keep the scope narrow.',
    prerequisites: ['Persistent runtime on a VPS'],
    deliverable: 'One interface or messaging surface connected to the runtime.',
    durationMinutes: 20,
    levelId: 'level-1',
    trackId: 'track-b',
    tags: ['telegram', 'discord', 'slack', 'interface'],
    projectOutcome: 'The agent can receive work through a real interface lane.',
    xpReward: 40,
    badge: 'interface-online',
    nextLessonSlug: 'add-your-first-skill-tool',
    steps: [
      {
        title: 'Pick one interface lane',
        body: 'Choose the single surface that matters now: Telegram, Discord, Slack, email, or another narrow interface.',
        expected: 'Only one interface is in scope for the first live path.',
      },
      {
        title: 'Connect the minimum credentials',
        body: 'Grant only the permissions required for that lane and keep the rollback owner documented.',
        expected: 'The integration is connected with scoped credentials.',
      },
      {
        title: 'Send a test message through the lane',
        body: 'Trigger one real inbound interaction and verify the runtime sees it.',
        expected: 'A real interface event reaches the runtime.',
      },
    ],
    validation: {
      checklist: [
        'One interface is connected.',
        'A live test event reaches the runtime.',
        'Rollback ownership for the credentials is documented.',
      ],
      doneLooksLike: 'The runtime can accept work from a real external surface.',
    },
    troubleshooting: [
      {
        symptom: 'Messages never arrive in the runtime.',
        cause: 'Credentials, webhook settings, or channel bindings are wrong.',
        fix: 'Retest with one simple message and inspect the binding or webhook path end to end.',
      },
      {
        symptom: 'The integration works but feels too broad.',
        cause: 'Permissions were granted for convenience instead of the minimum viable lane.',
        fix: 'Reduce scope before using the lane for real work.',
      },
    ],
    support: {
      prompt: 'Help me connect the first messaging or interface layer without over-scoping it.',
      escalation: 'Escalate if the interface requires unsafe global permissions or if you cannot verify inbound delivery.',
    },
  }),
  lesson({
    slug: 'add-your-first-skill-tool',
    title: '6. Add your first skill/tool',
    summary: 'Teach the runtime one capability that actually matters to the job.',
    objective: 'Attach one skill or tool and use it for a bounded task.',
    prerequisites: ['Persistent runtime', 'One live interface or local trigger'],
    deliverable: 'A running agent with one useful capability.',
    durationMinutes: 16,
    levelId: 'level-2',
    trackId: 'track-c',
    tags: ['skill', 'tool', 'capability', 'workflow'],
    projectOutcome: 'The agent can do one useful thing beyond generic chat.',
    xpReward: 80,
    badge: 'capable',
    nextLessonSlug: 'create-a-scheduled-workflow',
    steps: [
      {
        title: 'Pick one narrow capability',
        body: 'Choose a skill or tool that supports the job directly: look up docs, summarize leads, parse documents, or route work.',
        expected: 'The capability maps directly to the job statement.',
      },
      {
        title: 'Install or enable the capability',
        body: 'Add the skill with the smallest possible configuration and keep the verification path simple.',
        expected: 'The skill appears in the runtime configuration.',
      },
      {
        title: 'Run one useful task through it',
        body: 'Execute a single task that proves the new capability matters.',
        expected: 'The skill changes the result in a way you can verify.',
      },
    ],
    validation: {
      checklist: [
        'One new capability is enabled.',
        'The capability is used for a real task.',
        'You can explain why this capability belongs in the workflow.',
      ],
      doneLooksLike: 'The agent has one useful power tied to the actual job.',
    },
    troubleshooting: [
      {
        symptom: 'The skill is installed but does not help the outcome.',
        cause: 'You chose an impressive tool instead of one tied to the job.',
        fix: 'Replace it with a narrower capability that directly moves the workflow forward.',
      },
      {
        symptom: 'The capability is too brittle to trust.',
        cause: 'The verification path is vague and edge cases are unknown.',
        fix: 'Reduce the task to one simple success case and prove it first.',
      },
    ],
    support: {
      prompt: 'Help me choose and verify the first useful skill for this workflow.',
      escalation: 'Escalate if the skill requires risky permissions or if the task still has no clear validation output.',
    },
  }),
  lesson({
    slug: 'create-a-scheduled-workflow',
    title: '7. Create a scheduled workflow',
    summary: 'Move from manual testing into repeated execution with a clear schedule and safety boundary.',
    objective: 'Create one scheduled workflow that repeats a useful task.',
    prerequisites: ['One useful skill or tool attached'],
    deliverable: 'A scheduled workflow with an explicit cadence.',
    durationMinutes: 18,
    levelId: 'level-3',
    trackId: 'track-c',
    tags: ['cron', 'schedule', 'workflow', 'repeatability'],
    projectOutcome: 'The agent repeats one useful workflow on a schedule.',
    xpReward: 100,
    badge: 'automation-online',
    nextLessonSlug: 'see-your-agent-activity',
    steps: [
      {
        title: 'Pick a cadence that matches the job',
        body: 'Choose the slowest schedule that still creates value. Over-firing is how you waste money and trust.',
        expected: 'The cadence is justified by the workflow, not by impatience.',
      },
      {
        title: 'Create the scheduled job',
        body: 'Wire the task with a named schedule and a clear prompt or action boundary.',
        expected: 'A scheduled job exists and can be inspected.',
      },
      {
        title: 'Run one manual proof cycle',
        body: 'Trigger a controlled first run so you can see what the workflow actually does before waiting for the clock.',
        expected: 'A first scheduled execution path is visible.',
      },
    ],
    validation: {
      checklist: [
        'A real schedule is configured.',
        'The schedule is justified by business need.',
        'One manual proof run confirms the path works.',
      ],
      doneLooksLike: 'The workflow runs on purpose and on schedule.',
    },
    troubleshooting: [
      {
        symptom: 'The schedule fires too often or at the wrong time.',
        cause: 'The cadence was set before the job frequency was understood.',
        fix: 'Slow it down and retest from the smallest acceptable interval.',
      },
      {
        symptom: 'Scheduled runs exist but no one can verify them.',
        cause: 'The workflow has no visible output or run record.',
        fix: 'Add a named output and inspect the first manual run before trusting the cadence.',
      },
    ],
    support: {
      prompt: 'Help me create a scheduled workflow with the right cadence and first proof run.',
      escalation: 'Escalate if the workflow can cause customer or financial impact without a visible proof run.',
    },
  }),
  lesson({
    slug: 'see-your-agent-activity',
    title: '8. See your agent activity',
    summary: 'Use the control surface to see runs, recency, and failures instead of pretending silence means health.',
    objective: 'Inspect live agent activity in the control layer.',
    prerequisites: ['A persistent runtime with at least one manual or scheduled run'],
    deliverable: 'A live view of recent agent activity.',
    durationMinutes: 12,
    levelId: 'level-4',
    trackId: 'track-d',
    tags: ['runs', 'activity', 'monitoring', 'visibility'],
    projectOutcome: 'You can see what the runtime did recently.',
    xpReward: 60,
    badge: 'operator-aware',
    nextLessonSlug: 'set-a-cost-threshold',
    steps: [
      {
        title: 'Open the control view',
        body: 'Load the live control page and make sure it is reading authenticated runtime data.',
        expected: 'The control view returns assistant, runs, alerts, and runtime sections.',
      },
      {
        title: 'Inspect recent run history',
        body: 'Review the latest executions and note whether the agent is actually doing work or just looking alive.',
        expected: 'Recent runs are visible with status and timestamps.',
      },
      {
        title: 'Record one operator observation',
        body: 'Write one thing you learned from live activity: failure point, healthy cadence, or missing visibility.',
        expected: 'You leave the page with a concrete operational observation.',
      },
    ],
    validation: {
      checklist: [
        'The control page returns live data.',
        'Recent runs are visible.',
        'You captured one operational observation from the data.',
      ],
      doneLooksLike: 'You can answer what the agent did recently without guessing.',
    },
    troubleshooting: [
      {
        symptom: 'The control page is empty.',
        cause: 'The runtime has not produced real activity or auth is missing.',
        fix: 'Authenticate cleanly and trigger one controlled run before expecting visibility.',
      },
      {
        symptom: 'The page shows data but it is not actionable.',
        cause: 'You are reading it passively instead of looking for recency, failures, and mismatches.',
        fix: 'Write one concrete operator observation each time you review live activity.',
      },
    ],
    support: {
      prompt: 'Help me read the control page and decide what matters in recent activity.',
      escalation: 'Escalate if activity is missing for a supposedly live workflow or if the control path returns inconsistent data.',
    },
  }),
  lesson({
    slug: 'set-a-cost-threshold',
    title: '9. Set a cost threshold',
    summary: 'Use a visible limit so the runtime cannot quietly become an expensive hobby.',
    objective: 'Set and verify one budget or cost threshold.',
    prerequisites: ['Live activity visible in the control page'],
    deliverable: 'A visible budget threshold and current usage state.',
    durationMinutes: 12,
    levelId: 'level-5',
    trackId: 'track-d',
    tags: ['budget', 'cost', 'threshold', 'usage'],
    projectOutcome: 'You know where the budget line is and how close you are to it.',
    xpReward: 70,
    badge: 'guarded',
    nextLessonSlug: 'add-an-approval-gate',
    steps: [
      {
        title: 'Read the current usage baseline',
        body: 'Check current credits or spend before setting the limit so the threshold is anchored to reality.',
        expected: 'You know the current usage state.',
      },
      {
        title: 'Pick the first threshold',
        body: 'Set a limit low enough to matter but high enough to avoid false panic.',
        expected: 'A first threshold is documented and justified.',
      },
      {
        title: 'Define the response when the threshold trips',
        body: 'Decide whether the workflow pauses, alerts, or requires review when the budget line is crossed.',
        expected: 'Crossing the line has a real operational consequence.',
      },
    ],
    validation: {
      checklist: [
        'Current usage is visible.',
        'One threshold is defined.',
        'The response to crossing the threshold is explicit.',
      ],
      doneLooksLike: 'You know how much runway the workflow has and what happens when it overruns.',
    },
    troubleshooting: [
      {
        symptom: 'The threshold number feels arbitrary.',
        cause: 'It was set without checking actual usage or business value.',
        fix: 'Anchor the limit to current usage and the cost of one useful run cycle.',
      },
      {
        symptom: 'The threshold exists but changes nothing.',
        cause: 'There is no response rule tied to it.',
        fix: 'Decide whether the system pauses, alerts, or requires review when the line is crossed.',
      },
    ],
    support: {
      prompt: 'Help me set a sane cost threshold for this agent and define what happens when it trips.',
      escalation: 'Escalate if the workflow can exceed budget without a visible alert or if usage data is clearly wrong.',
    },
  }),
  lesson({
    slug: 'add-an-approval-gate',
    title: '10. Add an approval gate',
    summary: 'Require a human checkpoint before risky actions so trust comes from control, not optimism.',
    objective: 'Enable one approval gate for a risky action.',
    prerequisites: ['A live workflow and a budget threshold'],
    deliverable: 'A pending-approval path for one risky action.',
    durationMinutes: 14,
    levelId: 'level-5',
    trackId: 'track-d',
    tags: ['approval', 'governance', 'risk', 'human-in-the-loop'],
    projectOutcome: 'One risky action now pauses for human review.',
    xpReward: 90,
    badge: 'guarded',
    nextLessonSlug: 'build-a-lead-response-style-agent',
    steps: [
      {
        title: 'Name the risky action',
        body: 'Choose the first action that must never happen without human review: outbound send, status change, budget exception, or data release.',
        expected: 'One risky action is clearly named.',
      },
      {
        title: 'Create the approval pause',
        body: 'Use the existing approvals surface so the workflow can stop and wait for a decision.',
        expected: 'A pending approval can be created and seen.',
      },
      {
        title: 'Approve or reject one test item',
        body: 'Run a dry approval cycle and confirm the workflow respects the outcome.',
        expected: 'The system behaves differently on approval vs rejection.',
      },
    ],
    validation: {
      checklist: [
        'One risky action is gated.',
        'A pending approval is visible.',
        'Approve and reject paths both behave predictably.',
      ],
      doneLooksLike: 'A human can stop a risky action before it happens.',
    },
    troubleshooting: [
      {
        symptom: 'Approvals exist but the workflow ignores them.',
        cause: 'The gate is logged but not treated as a blocking step.',
        fix: 'Retest the flow and confirm the risky action does not proceed without a positive decision.',
      },
      {
        symptom: 'No one knows what deserves approval.',
        cause: 'Risk boundaries are still implicit.',
        fix: 'Write the risky action list and start with the highest-consequence one.',
      },
    ],
    support: {
      prompt: 'Help me add an approval gate around the first risky action in this workflow.',
      escalation: 'Escalate if the action affects money, production data, or customers and still cannot be blocked before execution.',
    },
  }),
  lesson({
    slug: 'build-a-lead-response-style-agent',
    title: '11. Build a lead-response style agent',
    summary: 'Package the basics into a narrow workflow that handles inbound leads with visible guardrails.',
    objective: 'Build a lead-response pattern that drafts or routes the next action.',
    prerequisites: ['Messaging layer connected', 'One skill attached', 'Approval gate understood'],
    deliverable: 'A lead-response workflow with routing, draft output, and review boundaries.',
    durationMinutes: 22,
    levelId: 'level-6',
    trackId: 'track-e',
    tags: ['lead response', 'routing', 'drafting', 'production pattern'],
    projectOutcome: 'Inbound leads can be triaged and drafted through a repeatable agent path.',
    xpReward: 100,
    badge: 'production-ready',
    nextLessonSlug: 'build-a-document-processing-style-agent',
    steps: [
      {
        title: 'Define the inbound trigger',
        body: 'Choose one source for lead intake and one source of truth for the record.',
        expected: 'Lead intake enters through one explicit path.',
      },
      {
        title: 'Draft the response or route',
        body: 'Have the agent produce a draft, classification, or routing note instead of sending autonomously on day one.',
        expected: 'A visible draft artifact exists before any send action.',
      },
      {
        title: 'Apply review and budget boundaries',
        body: 'Make sure risky outbound actions pause for review and repeated runs stay within threshold.',
        expected: 'The lead workflow is both useful and controlled.',
      },
    ],
    validation: {
      checklist: [
        'Lead intake has one trigger and one source of truth.',
        'The agent produces a visible draft or routing artifact.',
        'Review and budget boundaries are applied before autonomous send behavior.',
      ],
      doneLooksLike: 'A new lead can move through a repeatable draft or routing workflow without silent risk.',
    },
    troubleshooting: [
      {
        symptom: 'The agent wants to reply too early.',
        cause: 'Drafting and sending are still collapsed into one action.',
        fix: 'Split the workflow so the first production version only drafts or routes.',
      },
      {
        symptom: 'Lead data is inconsistent across tools.',
        cause: 'The source of truth was never chosen.',
        fix: 'Pick the system of record and treat other surfaces as context only.',
      },
    ],
    support: {
      prompt: 'Help me build a lead-response style agent with a visible draft and review boundary.',
      escalation: 'Escalate if the workflow would message customers automatically before the draft path is proven.',
    },
  }),
  lesson({
    slug: 'build-a-document-processing-style-agent',
    title: '12. Build a document-processing style agent',
    summary: 'Turn the runtime into a narrow document-processing pipeline with visible extraction and review steps.',
    objective: 'Build a document workflow that extracts, summarizes, or routes structured output.',
    prerequisites: ['One useful skill attached', 'Control page in use', 'Approval gate understood'],
    deliverable: 'A document-processing workflow with reviewable output.',
    durationMinutes: 24,
    levelId: 'level-6',
    trackId: 'track-e',
    tags: ['documents', 'extraction', 'routing', 'production pattern'],
    projectOutcome: 'Documents move through a repeatable extraction or routing pipeline.',
    xpReward: 100,
    badge: 'production-ready',
    steps: [
      {
        title: 'Pick one document class',
        body: 'Start with one bounded input type such as invoices, contracts, or intake forms.',
        expected: 'The workflow handles one document class, not every PDF in the world.',
      },
      {
        title: 'Define the structured output',
        body: 'Choose what the workflow produces: extracted fields, a routing tag, a summary, or a review packet.',
        expected: 'There is a clear output schema or review artifact.',
      },
      {
        title: 'Require review where confidence is low',
        body: 'Low-confidence extraction or high-risk downstream actions should pause for a human instead of bluffing.',
        expected: 'The document pipeline knows when to stop and ask for review.',
      },
    ],
    validation: {
      checklist: [
        'The workflow handles one document class only.',
        'Structured output or review artifact is defined.',
        'Low-confidence or risky cases pause for review.',
      ],
      doneLooksLike: 'A document can move through a repeatable extraction or routing pipeline with visible outputs and a human safety boundary.',
    },
    troubleshooting: [
      {
        symptom: 'The workflow breaks on minor document variations.',
        cause: 'The initial scope included too many formats and layouts.',
        fix: 'Narrow the document class and expand only after one clean success path exists.',
      },
      {
        symptom: 'Output looks plausible but cannot be trusted.',
        cause: 'The review boundary is missing when confidence is low.',
        fix: 'Route low-confidence cases to a human review queue instead of forcing automation.',
      },
    ],
    support: {
      prompt: 'Help me build a document-processing style agent with structured output and a review boundary.',
      escalation: 'Escalate if the workflow would commit financial, legal, or compliance-sensitive document changes without review.',
    },
  }),
];

export function getPicoLessonsByLevel(levelId: string) {
  return picoLessons.filter((lesson) => lesson.levelId === levelId);
}

export function getPicoLessonsByTrack(trackId: string) {
  return picoLessons.filter((lesson) => lesson.trackId === trackId);
}

export function getPicoLesson(slug: string) {
  return picoLessons.find((lesson) => lesson.slug === slug);
}

export function getNextPicoLesson(slug: string) {
  const index = picoLessons.findIndex((lesson) => lesson.slug === slug);
  if (index === -1 || index === picoLessons.length - 1) {
    return null;
  }
  return picoLessons[index + 1];
}


const badgeDescriptions: Record<string, string> = {
  "first-boot": "You proved the runtime installs and answers back.",
  deployed: "Your agent is now living somewhere more durable than one shell session.",
  "interface-online": "A real interface lane is wired in, not just terminal vibes.",
  capable: "The runtime can do one useful thing on purpose.",
  "automation-online": "A repeatable workflow exists and can run again tomorrow.",
  "operator-aware": "You can actually see what the runtime is doing.",
  guarded: "Budgets and approvals are in place before the embarrassing failure.",
  "production-ready": "You have a reusable pattern with operational ownership.",
};

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupLessonsByBadge() {
  const groups = new Map<string, PicoLesson[]>();
  for (const lesson of picoLessons) {
    const existing = groups.get(lesson.badge) ?? [];
    existing.push(lesson);
    groups.set(lesson.badge, existing);
  }
  return Array.from(groups.entries()).map(([id, lessons]) => ({ id, lessons }));
}

export type PicoTrackProgress = {
  id: string;
  title: string;
  summary: string;
  outcome: string;
  color: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  completed: boolean;
};

export type PicoBadgeProgress = {
  id: string;
  title: string;
  description: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  earned: boolean;
};

export function getPicoTrackProgress(completedLessonSlugs: string[], completedTrackIds: string[]) {
  const completed = new Set(completedLessonSlugs);
  const completedTracks = new Set(completedTrackIds);

  return picoTracks.map((track) => {
    const lessons = picoLessons.filter((lesson) => lesson.trackId === track.id);
    const completedLessons = lessons.filter((lesson) => completed.has(lesson.slug)).length;
    const totalLessons = lessons.length;
    const completedTrack = completedTracks.has(track.id) || completedLessons === totalLessons;

    return {
      id: track.id,
      title: track.title,
      summary: track.summary,
      outcome: track.outcome,
      color: track.color,
      completedLessons,
      totalLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      completed: completedTrack,
    } satisfies PicoTrackProgress;
  });
}

export function getPicoBadgeProgress(completedLessonSlugs: string[], earnedBadgeIds: string[]) {
  const completed = new Set(completedLessonSlugs);
  const earned = new Set(earnedBadgeIds);

  return groupLessonsByBadge().map(({ id, lessons }) => {
    const completedLessons = lessons.filter((lesson) => completed.has(lesson.slug)).length;
    const totalLessons = lessons.length;
    const badgeEarned = earned.has(id) || completedLessons === totalLessons;

    return {
      id,
      title: titleCase(id),
      description: badgeDescriptions[id] ?? "Progress badge earned by finishing the required Pico lessons.",
      completedLessons,
      totalLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      earned: badgeEarned,
    } satisfies PicoBadgeProgress;
  });
}

export function formatPicoEventLabel(event: string) {
  switch (event) {
    case "lesson_completed":
      return "Lesson completed";
    case "track_completed":
      return "Track completed";
    case "badge_earned":
      return "Badge earned";
    case "milestone_reached":
      return "Milestone reached";
    case "tutor_session_used":
      return "Grounded tutor lookup";
    case "starter_agent_deployed":
      return "Starter agent deployed";
    case "first_agent_run":
      return "First agent run";
    case "cost_threshold_set":
      return "Cost threshold saved";
    case "approval_gate_enabled":
      return "Approval gate enabled";
    default:
      return titleCase(event.replace(/_/g, "-"));
  }
}
