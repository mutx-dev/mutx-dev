export type FailureGuidanceKind = 'deployment_failed' | 'agent_not_responding'

export type FailureGuidanceAction = {
  label: string
  href: string
}

export type FailureGuidanceLesson = {
  title: string
  href: string
}

export type FailureGuidance = {
  kind: FailureGuidanceKind
  title: string
  summary: string
  stageNote: string
  lesson: FailureGuidanceLesson
  primaryAction: FailureGuidanceAction
  secondaryAction?: FailureGuidanceAction
  detectedFrom: string
}

type DeploymentFailureSignal = {
  deploymentId?: string
  status?: string | null
  errorMessage?: string | null
  events?: Array<{
    event_type?: string | null
    status?: string | null
    error_message?: string | null
  }>
}

type RuntimeFailureSignal = {
  status?: string | null
  heartbeatAt?: string | null
}

const RUNTIME_HEARTBEAT_STALE_MS = 3 * 60 * 1000
const HEARTBEAT_KEYWORDS = ['heartbeat', 'not responding', 'unresponsive', 'monitor_failed', 'stale']
const FAILURE_KEYWORDS = ['failed', 'error', 'crash', 'rollback', 'timeout', 'exited with status']
const RUNTIME_FAILURE_KEYWORDS = ['failed', 'error', 'offline', 'down', 'stale', 'unresponsive']

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

function joinSignals(values: Array<string | null | undefined>) {
  return values
    .map((value) => normalize(value))
    .filter(Boolean)
    .join(' | ')
}

function includesAny(signal: string, patterns: string[]) {
  return patterns.some((pattern) => signal.includes(pattern))
}

function buildAgentNotRespondingGuidance(detectedFrom: string): FailureGuidance {
  return {
    kind: 'agent_not_responding',
    title: 'Agent not responding',
    summary: 'The runtime stopped answering. Fix the keepalive path before you pile more features on top of a dead box.',
    stageNote: 'This is normal at this stage. Early agents usually break on liveness before they break on intelligence.',
    lesson: {
      title: 'Keep Your Agent Alive',
      href: '/pico/academy/keep-your-agent-alive',
    },
    primaryAction: {
      label: 'Go here to fix it',
      href: '/pico/academy/keep-your-agent-alive',
    },
    secondaryAction: {
      label: 'Open support lane',
      href: '/pico/support',
    },
    detectedFrom,
  }
}

function buildDeploymentFailedGuidance(deploymentId: string | undefined, detectedFrom: string): FailureGuidance {
  return {
    kind: 'deployment_failed',
    title: 'Deployment failed',
    summary: 'Good. The environment just told you what is still brittle. Use that signal and harden the next bottleneck.',
    stageNote: 'This is normal at this stage. Failed deploys are how local confidence turns into production confidence.',
    lesson: {
      title: 'Deploy Hermes on a VPS',
      href: '/pico/academy/deploy-hermes-on-a-vps',
    },
    primaryAction: {
      label: 'Go here to fix it',
      href: '/pico/academy/deploy-hermes-on-a-vps',
    },
    secondaryAction: deploymentId
      ? {
          label: 'Open deployment logs',
          href: `/dashboard/logs?deploymentId=${encodeURIComponent(deploymentId)}`,
        }
      : {
          label: 'Open support lane',
          href: '/pico/support',
        },
    detectedFrom,
  }
}

export function deriveDeploymentFailureGuidance(signal: DeploymentFailureSignal): FailureGuidance | null {
  const flattened = joinSignals([
    signal.status,
    signal.errorMessage,
    ...(signal.events ?? []).flatMap((event) => [event.event_type, event.status, event.error_message]),
  ])

  if (!flattened) {
    return null
  }

  if (includesAny(flattened, HEARTBEAT_KEYWORDS)) {
    return buildAgentNotRespondingGuidance(signal.errorMessage ?? flattened)
  }

  if (includesAny(flattened, FAILURE_KEYWORDS)) {
    return buildDeploymentFailedGuidance(signal.deploymentId, signal.errorMessage ?? flattened)
  }

  return null
}

export function deriveRuntimeFailureGuidance(signal: RuntimeFailureSignal): FailureGuidance | null {
  const normalizedStatus = normalize(signal.status)
  const heartbeatMs = signal.heartbeatAt ? new Date(signal.heartbeatAt).getTime() : Number.NaN
  const heartbeatIsValid = Number.isFinite(heartbeatMs)
  const heartbeatAgeMs = heartbeatIsValid ? Date.now() - heartbeatMs : null

  if (heartbeatAgeMs !== null && heartbeatAgeMs > RUNTIME_HEARTBEAT_STALE_MS) {
    const staleMinutes = Math.max(1, Math.round(heartbeatAgeMs / 60000))
    return buildAgentNotRespondingGuidance(`Last heartbeat ${staleMinutes} minutes ago.`)
  }

  if (includesAny(normalizedStatus, RUNTIME_FAILURE_KEYWORDS)) {
    return buildAgentNotRespondingGuidance(`Runtime status is ${signal.status ?? 'unknown'}.`)
  }

  return null
}
