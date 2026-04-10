import { PICO_LESSONS, PICO_LEVELS, type PicoLesson, type PicoTrack } from '@/lib/pico/content'

export type PicoPlan = 'free' | 'starter' | 'pro'
export type PicoEventKind =
  | 'account'
  | 'lesson_started'
  | 'lesson_completed'
  | 'xp'
  | 'run'
  | 'alert'
  | 'approval'
  | 'budget'
  | 'support'
  | 'community'

export type PicoEvent = {
  id: string
  kind: PicoEventKind
  title: string
  detail: string
  createdAt: string
  xpDelta?: number
  costDelta?: number
}

export type PicoAlert = {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  detail: string
  createdAt: string
  status: 'open' | 'resolved'
}

export type PicoApproval = {
  id: string
  action: string
  reason: string
  createdAt: string
  status: 'pending' | 'approved' | 'denied'
  resolvedAt?: string
}

export type PicoWorkspaceState = {
  version: 1
  createdAt: string
  lastUpdatedAt: string
  workspaceName: string
  focusTrackId: PicoTrack['id']
  plan: PicoPlan
  xp: number
  currentLevelId: number
  startedLessonIds: string[]
  completedLessonIds: string[]
  badges: string[]
  milestones: string[]
  tutorQuestionsUsed: number
  officeHoursRegistered: boolean
  projectShared: boolean
  autopilot: {
    agentName: string
    interfaceName: string
    connected: boolean
    lastActivityAt: string | null
    monthlyBudget: number
    monthlyUsage: number
    runCount: number
    alertChannels: {
      email: boolean
      webhook: boolean
    }
    approvalGateEnabled: boolean
    approvals: PicoApproval[]
    alerts: PicoAlert[]
  }
  events: PicoEvent[]
}

export const PICO_STORAGE_KEY = 'picomutx.workspace.v1'

export const PICO_PLAN_FEATURES: Record<
  PicoPlan,
  {
    name: string
    maxTutorQuestions: number
    monitoredAgents: number
    webhookAlerts: boolean
    retentionDays: number
    approvalGates: number
    note: string
  }
> = {
  free: {
    name: 'Free',
    maxTutorQuestions: 3,
    monitoredAgents: 0,
    webhookAlerts: false,
    retentionDays: 3,
    approvalGates: 0,
    note: 'Academy-first access with limited tutor usage and read-only autopilot.',
  },
  starter: {
    name: 'Starter',
    maxTutorQuestions: 25,
    monitoredAgents: 1,
    webhookAlerts: false,
    retentionDays: 7,
    approvalGates: 1,
    note: 'One monitored agent, email alerts, one approval gate, short retention.',
  },
  pro: {
    name: 'Pro',
    maxTutorQuestions: 100,
    monitoredAgents: 5,
    webhookAlerts: true,
    retentionDays: 30,
    approvalGates: 5,
    note: 'Multiple agents, webhook alerts, longer retention, deeper control.',
  },
}

const XP_EVENTS = {
  accountCreated: 25,
  firstTutorialStarted: 15,
  lessonCompletionBonus: 10,
  firstAgentRun: 25,
  successfulDeployment: 35,
  firstSkillAdded: 35,
  firstWorkflowBuilt: 40,
  firstMonitoringEventSeen: 20,
  firstAlertConfigured: 20,
  firstApprovalGateEnabled: 25,
  projectShared: 30,
  helpfulCommunityResponse: 30,
} as const

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value]
}

function lessonIndex(lessonId: string) {
  return PICO_LESSONS.findIndex((lesson) => lesson.id === lessonId)
}

function isLessonUnlocked(state: PicoWorkspaceState, lesson: PicoLesson) {
  const index = lessonIndex(lesson.id)
  if (index <= 0) return true
  const previousLesson = PICO_LESSONS[index - 1]
  return state.completedLessonIds.includes(previousLesson.id)
}

function buildEvent(input: Omit<PicoEvent, 'id' | 'createdAt'> & { createdAt?: string }): PicoEvent {
  return {
    id: createId(input.kind),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  }
}

function buildAlert(input: Omit<PicoAlert, 'id' | 'createdAt' | 'status'> & { createdAt?: string }): PicoAlert {
  return {
    id: createId('alert'),
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: 'open',
    ...input,
  }
}

function syncCurrentLevel(state: PicoWorkspaceState) {
  let currentLevelId = 0

  for (const level of PICO_LEVELS) {
    const lessons = PICO_LESSONS.filter((lesson) => lesson.levelId === level.id)
    if (lessons.length > 0 && lessons.every((lesson) => state.completedLessonIds.includes(lesson.id))) {
      currentLevelId = Math.min(level.id + 1, PICO_LEVELS[PICO_LEVELS.length - 1].id)
    }
  }

  return Math.min(currentLevelId, PICO_LEVELS[PICO_LEVELS.length - 1].id)
}

function syncBadges(state: PicoWorkspaceState) {
  const badgeRules: Array<[string, boolean]> = [
    ['Boot Sequence', state.completedLessonIds.includes('run-first-agent')],
    ['Ship It', state.completedLessonIds.includes('connect-interface-layer')],
    ['Toolsmith', state.completedLessonIds.includes('add-first-skill-tool')],
    ['Workflow Builder', state.completedLessonIds.includes('create-scheduled-workflow')],
    ['Watchtower', state.completedLessonIds.includes('see-agent-activity')],
    ['Control Loop', state.completedLessonIds.includes('add-approval-gate')],
    ['Pattern Operator', state.completedLessonIds.includes('build-document-processing-agent')],
  ]

  const badges = badgeRules.filter(([, ok]) => ok).map(([badge]) => badge)
  return { ...state, badges }
}

function pruneRetention(state: PicoWorkspaceState) {
  const retentionDays = PICO_PLAN_FEATURES[state.plan].retentionDays
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

  return {
    ...state,
    events: state.events.filter((event) => new Date(event.createdAt).getTime() >= cutoff),
    autopilot: {
      ...state.autopilot,
      alerts: state.autopilot.alerts.filter((alert) => new Date(alert.createdAt).getTime() >= cutoff),
      approvals: state.autopilot.approvals.filter(
        (approval) => new Date(approval.createdAt).getTime() >= cutoff || approval.status === 'pending',
      ),
    },
  }
}

function syncBudgetAlerts(state: PicoWorkspaceState) {
  const nextState = { ...state, autopilot: { ...state.autopilot } }
  const usage = nextState.autopilot.monthlyUsage
  const budget = nextState.autopilot.monthlyBudget
  const ratio = budget > 0 ? usage / budget : 0

  const existingBudgetWarning = nextState.autopilot.alerts.find(
    (alert) => alert.status === 'open' && alert.title === 'Budget warning',
  )
  const existingBudgetCritical = nextState.autopilot.alerts.find(
    (alert) => alert.status === 'open' && alert.title === 'Budget cap crossed',
  )

  if (ratio >= 1 && !existingBudgetCritical) {
    const alert = buildAlert({
      severity: 'critical',
      title: 'Budget cap crossed',
      detail: `Usage is ${usage.toFixed(2)} against a ${budget.toFixed(2)} monthly cap.`,
    })
    nextState.autopilot.alerts = [alert, ...nextState.autopilot.alerts]
    nextState.events = [
      buildEvent({ kind: 'alert', title: alert.title, detail: alert.detail }),
      ...nextState.events,
    ]
  } else if (ratio >= 0.8 && !existingBudgetWarning) {
    const alert = buildAlert({
      severity: 'warning',
      title: 'Budget warning',
      detail: `Usage is ${usage.toFixed(2)} against a ${budget.toFixed(2)} monthly cap.`,
    })
    nextState.autopilot.alerts = [alert, ...nextState.autopilot.alerts]
    nextState.events = [
      buildEvent({ kind: 'alert', title: alert.title, detail: alert.detail }),
      ...nextState.events,
    ]
  }

  return nextState
}

function finalizeState(state: PicoWorkspaceState) {
  const withLevel = {
    ...state,
    currentLevelId: syncCurrentLevel(state),
    lastUpdatedAt: new Date().toISOString(),
  }

  return pruneRetention(syncBudgetAlerts(syncBadges(withLevel)))
}

function awardMilestone(state: PicoWorkspaceState, milestone: string, xpDelta: number, title: string, detail: string) {
  if (state.milestones.includes(milestone)) {
    return state
  }

  return {
    ...state,
    xp: state.xp + xpDelta,
    milestones: [...state.milestones, milestone],
    events: [buildEvent({ kind: 'xp', title, detail, xpDelta }), ...state.events],
  }
}

export function createInitialWorkspaceState(): PicoWorkspaceState {
  const createdAt = new Date().toISOString()

  return finalizeState({
    version: 1,
    createdAt,
    lastUpdatedAt: createdAt,
    workspaceName: 'My first PicoMUTX workspace',
    focusTrackId: 'track-a',
    plan: 'starter',
    xp: XP_EVENTS.accountCreated,
    currentLevelId: 0,
    startedLessonIds: [],
    completedLessonIds: [],
    badges: [],
    milestones: ['account-created'],
    tutorQuestionsUsed: 0,
    officeHoursRegistered: false,
    projectShared: false,
    autopilot: {
      agentName: 'First Hermes Agent',
      interfaceName: 'Terminal',
      connected: false,
      lastActivityAt: null,
      monthlyBudget: 25,
      monthlyUsage: 0,
      runCount: 0,
      alertChannels: {
        email: true,
        webhook: false,
      },
      approvalGateEnabled: false,
      approvals: [],
      alerts: [],
    },
    events: [
      buildEvent({
        kind: 'account',
        title: 'Workspace created',
        detail: 'PicoMUTX workspace initialized in starter beta mode.',
        xpDelta: XP_EVENTS.accountCreated,
        createdAt,
      }),
    ],
  })
}

export function ensureWorkspaceState(state: PicoWorkspaceState | null | undefined) {
  return state ? finalizeState(state) : createInitialWorkspaceState()
}

export function getUnlockedLessons(state: PicoWorkspaceState) {
  return PICO_LESSONS.filter((lesson) => isLessonUnlocked(state, lesson))
}

export function getNextLesson(state: PicoWorkspaceState) {
  return PICO_LESSONS.find(
    (lesson) => isLessonUnlocked(state, lesson) && !state.completedLessonIds.includes(lesson.id),
  )
}

export function updateWorkspaceProfile(
  state: PicoWorkspaceState,
  input: { workspaceName?: string; agentName?: string; interfaceName?: string; focusTrackId?: PicoTrack['id'] },
) {
  return finalizeState({
    ...state,
    workspaceName: input.workspaceName?.trim() || state.workspaceName,
    focusTrackId: input.focusTrackId || state.focusTrackId,
    autopilot: {
      ...state.autopilot,
      agentName: input.agentName?.trim() || state.autopilot.agentName,
      interfaceName: input.interfaceName?.trim() || state.autopilot.interfaceName,
    },
  })
}

export function startLesson(state: PicoWorkspaceState, lessonId: string) {
  const lesson = PICO_LESSONS.find((item) => item.id === lessonId)
  if (!lesson || !isLessonUnlocked(state, lesson)) {
    return state
  }

  let nextState: PicoWorkspaceState = {
    ...state,
    startedLessonIds: addUnique(state.startedLessonIds, lessonId),
    events: [
      buildEvent({
        kind: 'lesson_started',
        title: `Started: ${lesson.title}`,
        detail: lesson.objective,
      }),
      ...state.events,
    ],
  }

  if (!nextState.milestones.includes('first-tutorial-started')) {
    nextState = awardMilestone(
      nextState,
      'first-tutorial-started',
      XP_EVENTS.firstTutorialStarted,
      'First tutorial started',
      'You kicked off the first real lesson instead of collecting ideas like fridge magnets.',
    )
  }

  return finalizeState(nextState)
}

export function completeLesson(state: PicoWorkspaceState, lessonId: string) {
  const lesson = PICO_LESSONS.find((item) => item.id === lessonId)
  if (!lesson || !isLessonUnlocked(state, lesson) || state.completedLessonIds.includes(lessonId)) {
    return state
  }

  let nextState: PicoWorkspaceState = {
    ...state,
    xp: state.xp + lesson.xpReward + XP_EVENTS.lessonCompletionBonus,
    startedLessonIds: addUnique(state.startedLessonIds, lessonId),
    completedLessonIds: [...state.completedLessonIds, lessonId],
    events: [
      buildEvent({
        kind: 'lesson_completed',
        title: `Completed: ${lesson.title}`,
        detail: lesson.expectedResult,
        xpDelta: lesson.xpReward + XP_EVENTS.lessonCompletionBonus,
      }),
      ...state.events,
    ],
  }

  if (lessonId === 'run-first-agent') {
    nextState = awardMilestone(
      nextState,
      'first-agent-run',
      XP_EVENTS.firstAgentRun,
      'First agent run verified',
      'Your agent answered a real task and crossed the line from theory into software.',
    )
    nextState.autopilot.connected = true
  }

  if (lessonId === 'deploy-hermes-vps') {
    nextState = awardMilestone(
      nextState,
      'successful-deployment',
      XP_EVENTS.successfulDeployment,
      'Successful deployment',
      'Your agent now has a persistent runtime instead of a laptop hostage situation.',
    )
  }

  if (lessonId === 'add-first-skill-tool') {
    nextState = awardMilestone(
      nextState,
      'first-skill-added',
      XP_EVENTS.firstSkillAdded,
      'First skill added',
      'The agent can do more than chat politely into the void.',
    )
  }

  if (lessonId === 'create-scheduled-workflow') {
    nextState = awardMilestone(
      nextState,
      'first-workflow-built',
      XP_EVENTS.firstWorkflowBuilt,
      'First workflow built',
      'You made the agent repeat useful work on purpose.',
    )
  }

  if (lessonId === 'see-agent-activity') {
    nextState = awardMilestone(
      nextState,
      'first-monitoring-event-seen',
      XP_EVENTS.firstMonitoringEventSeen,
      'Monitoring signal captured',
      'You can now see activity instead of hoping for the best.',
    )
  }

  return finalizeState(nextState)
}

export function recordManualRun(
  state: PicoWorkspaceState,
  input: { summary: string; costDelta: number },
) {
  const detail = input.summary.trim() || 'Manual run logged'
  const costDelta = Math.max(0, Number(input.costDelta) || 0)

  return finalizeState({
    ...state,
    autopilot: {
      ...state.autopilot,
      connected: true,
      lastActivityAt: new Date().toISOString(),
      monthlyUsage: Number((state.autopilot.monthlyUsage + costDelta).toFixed(2)),
      runCount: state.autopilot.runCount + 1,
    },
    events: [
      buildEvent({
        kind: 'run',
        title: 'Manual run logged',
        detail,
        costDelta,
      }),
      ...state.events,
    ],
  })
}

export function setMonthlyBudget(state: PicoWorkspaceState, monthlyBudget: number) {
  return finalizeState({
    ...state,
    autopilot: {
      ...state.autopilot,
      monthlyBudget: Math.max(1, Number(monthlyBudget) || state.autopilot.monthlyBudget),
    },
    events: [
      buildEvent({
        kind: 'budget',
        title: 'Budget threshold updated',
        detail: `Monthly budget set to ${Math.max(1, Number(monthlyBudget) || state.autopilot.monthlyBudget)} credits.`,
      }),
      ...state.events,
    ],
  })
}

export function setAlertChannel(
  state: PicoWorkspaceState,
  channel: 'email' | 'webhook',
  enabled: boolean,
) {
  if (channel === 'webhook' && !PICO_PLAN_FEATURES[state.plan].webhookAlerts) {
    return state
  }

  let nextState: PicoWorkspaceState = {
    ...state,
    autopilot: {
      ...state.autopilot,
      alertChannels: {
        ...state.autopilot.alertChannels,
        [channel]: enabled,
      },
    },
    events: [
      buildEvent({
        kind: 'alert',
        title: `${channel === 'email' ? 'Email' : 'Webhook'} alerts ${enabled ? 'enabled' : 'disabled'}`,
        detail: `${channel === 'email' ? 'Email' : 'Webhook'} alert channel changed.`,
      }),
      ...state.events,
    ],
  }

  if (enabled) {
    nextState = awardMilestone(
      nextState,
      'first-alert-configured',
      XP_EVENTS.firstAlertConfigured,
      'First alert configured',
      'Warnings now have somewhere to go instead of dying quietly in a corner.',
    )
  }

  return finalizeState(nextState)
}

export function setPlan(state: PicoWorkspaceState, plan: PicoPlan) {
  const nextState = {
    ...state,
    plan,
    autopilot: {
      ...state.autopilot,
      alertChannels: {
        ...state.autopilot.alertChannels,
        webhook: plan === 'pro' ? state.autopilot.alertChannels.webhook : false,
      },
      approvalGateEnabled:
        PICO_PLAN_FEATURES[plan].approvalGates > 0 ? state.autopilot.approvalGateEnabled : false,
    },
    events: [
      buildEvent({
        kind: 'account',
        title: `Plan set to ${PICO_PLAN_FEATURES[plan].name}`,
        detail: PICO_PLAN_FEATURES[plan].note,
      }),
      ...state.events,
    ],
  }

  return finalizeState(nextState)
}

export function setApprovalGateEnabled(state: PicoWorkspaceState, enabled: boolean) {
  if (enabled && PICO_PLAN_FEATURES[state.plan].approvalGates < 1) {
    return state
  }

  let nextState: PicoWorkspaceState = {
    ...state,
    autopilot: {
      ...state.autopilot,
      approvalGateEnabled: enabled,
    },
    events: [
      buildEvent({
        kind: 'approval',
        title: `Approval gate ${enabled ? 'enabled' : 'disabled'}`,
        detail: enabled
          ? 'Risky actions now queue for approval before execution.'
          : 'Risky actions will no longer stop for approval.',
      }),
      ...state.events,
    ],
  }

  if (enabled) {
    nextState = awardMilestone(
      nextState,
      'first-approval-gate-enabled',
      XP_EVENTS.firstApprovalGateEnabled,
      'First approval gate enabled',
      'You finally stopped trusting risky actions on vibes alone.',
    )
  }

  return finalizeState(nextState)
}

export function queueApproval(state: PicoWorkspaceState, input: { action: string; reason: string }) {
  if (!state.autopilot.approvalGateEnabled) {
    return state
  }

  const pendingApprovals = state.autopilot.approvals.filter((approval) => approval.status === 'pending')
  if (pendingApprovals.length >= PICO_PLAN_FEATURES[state.plan].approvalGates) {
    return state
  }

  const approval: PicoApproval = {
    id: createId('approval'),
    action: input.action.trim() || 'Unnamed risky action',
    reason: input.reason.trim() || 'Manual approval requested',
    createdAt: new Date().toISOString(),
    status: 'pending',
  }

  return finalizeState({
    ...state,
    autopilot: {
      ...state.autopilot,
      approvals: [approval, ...state.autopilot.approvals],
    },
    events: [
      buildEvent({
        kind: 'approval',
        title: 'Approval requested',
        detail: `${approval.action} is waiting for a human decision.`,
      }),
      ...state.events,
    ],
  })
}

export function resolveApproval(
  state: PicoWorkspaceState,
  approvalId: string,
  decision: 'approved' | 'denied',
) {
  const approvals = state.autopilot.approvals.map((approval) =>
    approval.id === approvalId && approval.status === 'pending'
      ? { ...approval, status: decision, resolvedAt: new Date().toISOString() }
      : approval,
  )

  const updatedApproval = approvals.find((approval) => approval.id === approvalId)
  if (!updatedApproval) {
    return state
  }

  return finalizeState({
    ...state,
    autopilot: {
      ...state.autopilot,
      approvals,
    },
    events: [
      buildEvent({
        kind: 'approval',
        title: `Approval ${decision}`,
        detail: `${updatedApproval.action} was ${decision}.`,
      }),
      ...state.events,
    ],
  })
}

export function resolveAlert(state: PicoWorkspaceState, alertId: string) {
  return finalizeState({
    ...state,
    autopilot: {
      ...state.autopilot,
      alerts: state.autopilot.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert,
      ),
    },
  })
}

export function canAskTutorQuestion(state: PicoWorkspaceState) {
  return state.tutorQuestionsUsed < PICO_PLAN_FEATURES[state.plan].maxTutorQuestions
}

export function recordTutorQuestion(state: PicoWorkspaceState) {
  return finalizeState({
    ...state,
    tutorQuestionsUsed: state.tutorQuestionsUsed + 1,
  })
}

export function registerOfficeHours(state: PicoWorkspaceState) {
  if (state.officeHoursRegistered) {
    return state
  }

  return finalizeState({
    ...state,
    officeHoursRegistered: true,
    events: [
      buildEvent({
        kind: 'community',
        title: 'Office hours registered',
        detail: 'You booked the community support lane for the current build cycle.',
      }),
      ...state.events,
    ],
  })
}

export function shareProject(state: PicoWorkspaceState) {
  if (state.projectShared) {
    return state
  }

  const nextState = finalizeState({
    ...state,
    projectShared: true,
    events: [
      buildEvent({
        kind: 'community',
        title: 'Project shared',
        detail: 'Your project pattern is ready to show other builders.',
      }),
      ...state.events,
    ],
  })

  return awardMilestone(
    nextState,
    'project-shared',
    XP_EVENTS.projectShared,
    'Project shared',
    'Shipping is contagious. You gave the next builder something real to copy.',
  )
}

export function countCompletedLessonsForTrack(state: PicoWorkspaceState, trackId: PicoTrack['id']) {
  return PICO_LESSONS.filter(
    (lesson) => lesson.trackId === trackId && state.completedLessonIds.includes(lesson.id),
  ).length
}
