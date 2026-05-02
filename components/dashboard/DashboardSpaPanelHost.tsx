'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  ChevronRight,
  Gauge,
  Loader2,
  MessageSquare,
  PanelRight,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { ErrorBoundary } from '@/components/app/ErrorBoundary'
import { DashboardContentRouter } from '@/components/dashboard/DashboardContentRouter'
import { useDesktopStatus } from '@/components/desktop/useDesktopStatus'
import {
  isEssentialPanel,
  resolveDashboardPanel,
} from '@/lib/dashboardPanels'
import { useDashboardPathname, useNavigateToPanel } from '@/lib/navigation'
import { type CurrentUser, useMissionControl } from '@/lib/store'
import { cn } from '@/lib/utils'

type BootStatus = 'pending' | 'running' | 'complete' | 'error'

type BootStepKey =
  | 'auth'
  | 'capabilities'
  | 'config'
  | 'connect'
  | 'agents'
  | 'sessions'
  | 'projects'
  | 'memory'
  | 'skills'

type BootStep = {
  key: BootStepKey
  label: string
  detail: string
  status: BootStatus
}

const INITIAL_BOOT_STEPS: BootStep[] = [
  { key: 'auth', label: 'Auth', detail: 'Resolve the active operator session.', status: 'pending' },
  {
    key: 'capabilities',
    label: 'Capabilities',
    detail: 'Detect local versus gateway shell mode.',
    status: 'pending',
  },
  {
    key: 'config',
    label: 'Config',
    detail: 'Load subscription, interface mode, and workspace identity.',
    status: 'pending',
  },
  {
    key: 'connect',
    label: 'Connect',
    detail: 'Initialize the runtime connection stub for live updates.',
    status: 'pending',
  },
  {
    key: 'agents',
    label: 'Agents',
    detail: 'Preload the fleet registry.',
    status: 'pending',
  },
  {
    key: 'sessions',
    label: 'Sessions',
    detail: 'Preload session presence.',
    status: 'pending',
  },
  {
    key: 'projects',
    label: 'Projects',
    detail: 'Prime template-backed project inventory.',
    status: 'pending',
  },
  {
    key: 'memory',
    label: 'Memory',
    detail: 'Reserve the memory lane until the route contract lands.',
    status: 'pending',
  },
  {
    key: 'skills',
    label: 'Skills',
    detail: 'Prime the skill catalog for operator context.',
    status: 'pending',
  },
]

function mapUser(payload: Record<string, unknown>): CurrentUser | null {
  const id = typeof payload.id === 'string' ? payload.id : null
  const email = typeof payload.email === 'string' ? payload.email : undefined
  const name =
    typeof payload.name === 'string'
      ? payload.name
      : typeof payload.display_name === 'string'
        ? payload.display_name
        : 'Operator'

  if (!id) {
    return null
  }

  return {
    id,
    email,
    username: email?.split('@')[0] || name.toLowerCase().replace(/\s+/g, '-'),
    display_name: name,
    role: 'admin',
  }
}

async function readJson(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : 'Request failed'
    throw new Error(detail)
  }

  return payload
}

function getBootTone(status: BootStatus) {
  if (status === 'complete') {
    return 'border-emerald-400/24 bg-emerald-400/10 text-emerald-100'
  }
  if (status === 'error') {
    return 'border-rose-400/24 bg-rose-400/10 text-rose-100'
  }
  if (status === 'running') {
    return 'border-sky-400/24 bg-sky-400/10 text-sky-100'
  }
  return 'border-white/10 bg-white/5 text-slate-300'
}

function BootLedger({
  steps,
  compact = false,
}: {
  steps: BootStep[]
  compact?: boolean
}) {
  return (
    <div className={cn('space-y-2', compact ? 'text-xs' : 'text-sm')}>
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={cn(
            'rounded-[18px] border px-3 py-3',
            compact ? 'space-y-1.5' : 'space-y-2',
            getBootTone(step.status),
          )}
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <span className='font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.18em]'>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className='font-medium'>{step.label}</span>
            </div>
            {step.status === 'running' ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : step.status === 'complete' ? (
              <Sparkles className='h-3.5 w-3.5' />
            ) : step.status === 'error' ? (
              <X className='h-3.5 w-3.5' />
            ) : null}
          </div>
          <p className='leading-5 text-slate-300/90'>{step.detail}</p>
        </div>
      ))}
    </div>
  )
}

function PanelErrorFallback({
  panelLabel,
}: {
  panelLabel: string
}) {
  return (
    <div className='rounded-[28px] border border-rose-400/22 bg-[rgba(69,29,24,0.44)] p-6 text-rose-100'>
      <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200'>Panel error</p>
      <h2 className='mt-3 font-[family:var(--font-site-display)] text-[1.6rem] tracking-[-0.05em]'>
        {panelLabel} failed inside the SPA shell
      </h2>
      <p className='mt-3 max-w-2xl text-sm leading-6 text-rose-100/80'>
        The panel threw after boot, but the shell stayed alive. Use the route header actions or refresh
        the panel to recover without losing the entire shell.
      </p>
    </div>
  )
}

export function DashboardSpaPanelHost() {
  const { isDesktop } = useDesktopStatus()
  const pathname = useDashboardPathname(true)
  const navigateToPanel = useNavigateToPanel()
  const panel = resolveDashboardPanel(pathname)
  const bootStartedRef = useRef(false)
  const desktopRuntimeActive =
    typeof window !== 'undefined' ? Boolean(window.mutxDesktop?.isDesktop) : false

  const [
    bootComplete,
    currentUser,
    interfaceMode,
    subscription,
    agents,
    sessions,
    monitoringAlerts,
    liveFeedOpen,
    chatPanelOpen,
    updateAvailable,
    bannerDismissed,
    setActiveTab,
    setBootComplete,
    setCapabilitiesChecked,
    setCurrentUser,
    setDashboardMode,
    setInterfaceMode,
    setSubscription,
    setConnection,
    toggleLiveFeed,
    setChatPanelOpen,
    dismissBanner,
    fetchAgents,
    fetchSessions,
    fetchRuns,
    fetchOverview,
    fetchAnalyticsSummary,
    fetchMonitoringAlerts,
    fetchBudgets,
    fetchDeployments,
  ] = useMissionControl((state) => [
    state.bootComplete,
    state.currentUser,
    state.interfaceMode,
    state.subscription,
    state.agents,
    state.sessions,
    state.monitoringAlerts,
    state.liveFeedOpen,
    state.chatPanelOpen,
    state.updateAvailable,
    state.bannerDismissed,
    state.setActiveTab,
    state.setBootComplete,
    state.setCapabilitiesChecked,
    state.setCurrentUser,
    state.setDashboardMode,
    state.setInterfaceMode,
    state.setSubscription,
    state.setConnection,
    state.toggleLiveFeed,
    state.setChatPanelOpen,
    state.dismissBanner,
    state.fetchAgents,
    state.fetchSessions,
    state.fetchRuns,
    state.fetchOverview,
    state.fetchAnalyticsSummary,
    state.fetchMonitoringAlerts,
    state.fetchBudgets,
    state.fetchDeployments,
  ])

  const [orgName, setOrgName] = useState('MUTX')
  const [bootVisible, setBootVisible] = useState(!bootComplete)
  const [bootSteps, setBootSteps] = useState<BootStep[]>(INITIAL_BOOT_STEPS)

  useEffect(() => {
    setActiveTab(panel)
  }, [panel, setActiveTab])

  useEffect(() => {
    if (isDesktop || bootComplete || bootStartedRef.current) {
      if (bootComplete) {
        setBootVisible(false)
      }
      return
    }

    bootStartedRef.current = true
    setBootVisible(true)

    const updateStep = (
      key: BootStepKey,
      status: BootStatus,
      detail?: string,
    ) => {
      setBootSteps((current) =>
        current.map((step) =>
          step.key === key
            ? {
                ...step,
                status,
                detail: detail || step.detail,
              }
            : step,
        ),
      )
    }

    const runBoot = async () => {
      updateStep('auth', 'running')
      try {
        const userPayload = (await readJson('/api/auth/me')) as Record<string, unknown>
        const user = mapUser(userPayload)
        setCurrentUser(user)
        updateStep(
          'auth',
          'complete',
          user?.display_name
            ? `Signed in as ${user.display_name}.`
            : 'Operator session resolved.',
        )
      } catch (error) {
        setCurrentUser(null)
        updateStep(
          'auth',
          'error',
          error instanceof Error ? error.message : 'Operator session unavailable.',
        )
      }

      updateStep('capabilities', 'running')
      const nextDashboardMode = window.mutxDesktop?.isDesktop ? 'local' : 'gateway'
      setDashboardMode(nextDashboardMode)
      setCapabilitiesChecked(true)
      updateStep(
        'capabilities',
        'complete',
        nextDashboardMode === 'local'
          ? 'Local desktop shell detected.'
          : 'Gateway browser shell detected.',
      )

      updateStep('config', 'running')
      try {
        const configPayload = (await readJson('/api/dashboard/settings')) as Record<string, unknown>
        const configMode =
          configPayload.interfaceMode === 'essential' ? 'essential' : 'full'
        const configSubscription =
          configPayload.subscription === 'enterprise' || configPayload.subscription === 'pro'
            ? configPayload.subscription
            : 'free'
        setInterfaceMode(configMode)
        setSubscription(configSubscription)
        setOrgName(typeof configPayload.orgName === 'string' ? configPayload.orgName : 'MUTX')
        updateStep(
          'config',
          'complete',
          `${configMode} mode · ${configSubscription} subscription.`,
        )
      } catch (error) {
        const fallbackSubscription = 'free'
        const fallbackMode = 'essential'
        setInterfaceMode(fallbackMode)
        setSubscription(fallbackSubscription)
        updateStep(
          'config',
          'error',
          error instanceof Error ? error.message : 'Settings route unavailable.',
        )
      }

      updateStep('connect', 'running')
      setConnection({
        isConnected: false,
        reconnectAttempts: 0,
        sseConnected: false,
        url: window.location.origin,
      })
      updateStep('connect', 'complete', 'Realtime bridge stub initialized.')

      const parallelLoaders: Array<[BootStepKey, () => Promise<unknown>, string]> = [
        ['agents', async () => fetchAgents(), 'Agent registry warmed.'],
        ['sessions', async () => fetchSessions(), 'Session list warmed.'],
        [
          'projects',
          async () => readJson('/api/dashboard/templates'),
          'Template catalog warmed as project inventory.',
        ],
        [
          'memory',
          async () => Promise.resolve({ status: 'reserved' }),
          'Memory lane reserved until backend contracts ship.',
        ],
        [
          'skills',
          async () => readJson('/api/dashboard/clawhub/skills'),
          'Skill catalog warmed.',
        ],
      ]

      parallelLoaders.forEach(([key]) => updateStep(key, 'running'))
      const parallelResults = await Promise.allSettled(
        parallelLoaders.map(async ([key, loader, successDetail]) => {
          await loader()
          return { key, successDetail }
        }),
      )

      parallelResults.forEach((result, index) => {
        const [key] = parallelLoaders[index]
        if (result.status === 'fulfilled') {
          updateStep(key, 'complete', result.value.successDetail)
          return
        }

        updateStep(
          key,
          'error',
          result.reason instanceof Error ? result.reason.message : 'Warmup failed.',
        )
      })

      await Promise.allSettled([
        fetchRuns(),
        fetchOverview(),
        fetchAnalyticsSummary(),
        fetchMonitoringAlerts(),
        fetchBudgets(),
        fetchDeployments(),
      ])

      setBootComplete(true)
      window.setTimeout(() => {
        setBootVisible(false)
      }, 240)
    }

    void runBoot()
  }, [
    bootComplete,
    fetchAgents,
    fetchAnalyticsSummary,
    fetchBudgets,
    fetchDeployments,
    fetchMonitoringAlerts,
    fetchOverview,
    fetchRuns,
    fetchSessions,
    isDesktop,
    setBootComplete,
    setCapabilitiesChecked,
    setConnection,
    setCurrentUser,
    setDashboardMode,
    setInterfaceMode,
    setSubscription,
  ])

  const completedSteps = bootSteps.filter((step) => step.status === 'complete').length
  const panelLabel = useMemo(
    () => panel.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    [panel],
  )

  if (isDesktop) {
    return null
  }

  return (
    <div className='space-y-4'>
      {updateAvailable && !bannerDismissed ? (
        <div className='rounded-[22px] border border-sky-400/24 bg-sky-400/10 px-4 py-3 text-sm text-sky-50'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100'>
                Update available
              </p>
              <p className='mt-1 text-sm text-sky-50/85'>
                MUTX {updateAvailable} is ready for this operator shell.
              </p>
            </div>
            <button
              type='button'
              onClick={dismissBanner}
              className='rounded-full border border-sky-200/20 bg-[#0f1728] px-3 py-1.5 text-xs font-medium text-sky-100'
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className='rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#101726_0%,#0b1119_100%)] px-4 py-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd]'>
              <span className='rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-sky-100'>
                ContentRouter active
              </span>
              <span>{orgName}</span>
              <span>{interfaceMode} mode</span>
            </div>
            <div>
              <h2 className='font-[family:var(--font-site-display)] text-[1.7rem] leading-[0.98] tracking-[-0.06em] text-white'>
                The dashboard shell is routing everything from one surface
              </h2>
              <p className='mt-2 max-w-4xl text-sm leading-6 text-slate-300'>
                The panel switchboard now owns boot, routing, gating, and failure isolation. Legacy
                page routes remain as compatibility entrypoints, but the active shell no longer depends on
                each route rebuilding its own world.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={toggleLiveFeed}
              className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101722] px-3 py-2 text-xs font-medium text-slate-100'
            >
              <PanelRight className='h-4 w-4 text-sky-300' />
              {liveFeedOpen ? 'Hide live feed' : 'Show live feed'}
            </button>
            <button
              type='button'
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101722] px-3 py-2 text-xs font-medium text-slate-100'
            >
              <MessageSquare className='h-4 w-4 text-cyan-300' />
              {chatPanelOpen ? 'Close chat' : 'Open chat'}
            </button>
            <div className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#101722] p-1 text-xs'>
              <button
                type='button'
                onClick={() => setInterfaceMode('essential')}
                className={cn(
                  'rounded-full px-3 py-1.5',
                  interfaceMode === 'essential'
                    ? 'bg-white text-[#09111c]'
                    : 'text-slate-300',
                )}
              >
                Essential
              </button>
              <button
                type='button'
                onClick={() => setInterfaceMode('full')}
                disabled={subscription === 'free'}
                className={cn(
                  'rounded-full px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40',
                  interfaceMode === 'full'
                    ? 'bg-sky-400 text-[#09111c]'
                    : 'text-slate-300',
                )}
              >
                Full
              </button>
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-300'>
          <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
            {currentUser?.display_name || 'Sign-in pending'}
          </span>
          <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
            {subscription || 'free'} subscription
          </span>
          <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
            {isEssentialPanel(panel) ? 'Essential panel' : 'Full panel'}
          </span>
        </div>
      </div>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='min-w-0 space-y-4'>
          <ErrorBoundary key={panel} fallback={<PanelErrorFallback panelLabel={panelLabel} />}>
            <DashboardContentRouter
              panel={panel}
              interfaceMode={interfaceMode}
              subscription={subscription}
            />
          </ErrorBoundary>
        </div>

        <aside className={cn('space-y-4', liveFeedOpen ? 'block' : 'hidden')}>
          <section className='rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#101726_0%,#0b1119_100%)] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd]'>
                  Live feed
                </p>
                <p className='mt-2 text-sm text-slate-300'>
                  Shell posture, boot state, and interface mode in one side rail.
                </p>
              </div>
              <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200'>
                {panelLabel}
              </span>
            </div>

            <div className='mt-4 grid gap-3'>
              <div className='rounded-[18px] border border-white/10 bg-[#0f1728] p-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
                  <Gauge className='h-3.5 w-3.5 text-sky-300' />
                  Shell state
                </div>
                <div className='mt-3 space-y-2 text-sm text-slate-200'>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Mode</span>
                    <span className='text-slate-400'>{interfaceMode}</span>
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Runtime</span>
                    <span className='text-slate-400'>{desktopRuntimeActive ? 'local' : 'gateway'}</span>
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Account</span>
                    <span className='truncate text-slate-400'>{currentUser?.display_name || 'pending'}</span>
                  </div>
                </div>
              </div>

              <div className='rounded-[18px] border border-white/10 bg-[#0f1728] p-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
                  <Activity className='h-3.5 w-3.5 text-cyan-300' />
                  Warm state
                </div>
                <div className='mt-3 space-y-2 text-sm text-slate-200'>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Agents</span>
                    <span className='text-slate-400'>{agents.length}</span>
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Sessions</span>
                    <span className='text-slate-400'>{sessions.length}</span>
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <span>Alerts</span>
                    <span className='text-slate-400'>{monitoringAlerts.length}</span>
                  </div>
                </div>
              </div>

              <div className='rounded-[18px] border border-white/10 bg-[#0f1728] p-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
                  <ShieldCheck className='h-3.5 w-3.5 text-emerald-300' />
                  Boot ledger
                </div>
                <div className='mt-3'>
                  <BootLedger steps={bootSteps} compact />
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {chatPanelOpen ? (
        <div className='fixed inset-y-6 right-6 z-40 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#101726_0%,#0b1119_100%)] shadow-[0_38px_120px_rgba(2,2,5,0.58)]'>
          <div className='flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd]'>
                Chat panel
              </p>
              <h3 className='mt-2 font-[family:var(--font-site-display)] text-[1.3rem] tracking-[-0.05em] text-white'>
                Session relay
              </h3>
            </div>
            <button
              type='button'
              onClick={() => setChatPanelOpen(false)}
              className='rounded-full border border-white/10 bg-[#0f1728] p-2 text-slate-200'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          <div className='space-y-4 px-5 py-5'>
            <p className='text-sm leading-6 text-slate-300'>
              The shell keeps chat as a first-class panel. Open the session surface to work the live
              session list without leaving the dashboard.
            </p>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-[18px] border border-white/10 bg-[#0f1728] p-4'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
                  Sessions
                </p>
                <p className='mt-3 text-2xl font-semibold text-white'>{sessions.length}</p>
              </div>
              <div className='rounded-[18px] border border-white/10 bg-[#0f1728] p-4'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>
                  Essential route
                </p>
                <p className='mt-3 text-sm leading-6 text-slate-200'>
                  Chat stays available even when the interface is reduced to essential mode.
                </p>
              </div>
            </div>

            <button
              type='button'
              onClick={() => {
                setChatPanelOpen(false)
                navigateToPanel('chat')
              }}
              className='inline-flex items-center gap-2 rounded-full border border-sky-400/28 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100'
            >
              Open sessions panel
              <ArrowRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      ) : null}

      {bootVisible ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/82 px-4 backdrop-blur-md'>
          <div className='w-full max-w-3xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#101726_0%,#0b1119_100%)] p-6 shadow-[0_38px_120px_rgba(2,2,5,0.58)]'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-3'>
                <div className='inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100'>
                  <Bot className='h-3.5 w-3.5' />
                  Boot sequence
                </div>
                <div>
                  <h2 className='font-[family:var(--font-site-display)] text-[1.95rem] tracking-[-0.06em] text-white'>
                    Bringing the dashboard online
                  </h2>
                  <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>
                    The shell is walking auth, capabilities, config, and the initial data preload before
                    releasing panel control.
                  </p>
                </div>
              </div>

              <div className='rounded-[22px] border border-white/10 bg-[#0f1728] px-4 py-3 text-right'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400'>
                  Progress
                </p>
                <p className='mt-2 text-3xl font-semibold text-white'>
                  {completedSteps}
                  <span className='text-slate-500'>/{bootSteps.length}</span>
                </p>
              </div>
            </div>

            <div className='mt-6 rounded-full border border-white/10 bg-[#0f1728] p-1'>
              <div
                className='h-2 rounded-full bg-[linear-gradient(90deg,#60a5fa_0%,#22d3ee_100%)] transition-all'
                style={{ width: `${(completedSteps / bootSteps.length) * 100}%` }}
              />
            </div>

            <div className='mt-6'>
              <BootLedger steps={bootSteps} />
            </div>

            <div className='mt-6 flex flex-wrap items-center gap-2 text-[11px] text-slate-400'>
              <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
                {orgName}
              </span>
              <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
                {subscription || 'free'}
              </span>
              <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
                {interfaceMode}
              </span>
              <span className='rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
                {desktopRuntimeActive ? 'desktop' : 'browser'}
              </span>
              <span className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0f1728] px-2.5 py-1'>
                <ChevronRight className='h-3.5 w-3.5 text-sky-300' />
                {panelLabel}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
