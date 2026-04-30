'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import {
  Activity,
  BarChart3,
  BellRing,
  Bot,
  Brain,
  FileText,
  GitBranchPlus,
  History,
  Key,
  LayoutGrid,
  Network,
  Radar,
  ShieldCheck,
  TerminalSquare,
  Users,
  Wallet,
  Webhook,
  Workflow,
} from 'lucide-react'

import { DemoRoutePage } from '@/components/dashboard/DemoRoutePage'
import { LoadingState } from '@/components/dashboard/LoadingState'
import { RouteHeader } from '@/components/dashboard/RouteHeader'
import { DashboardSectionPage } from '@/components/dashboard/DashboardSectionPage'
import type { InterfaceMode } from '@/lib/store'
import {
  type DashboardPanelId,
  isPanelAccessibleInMode,
} from '@/lib/dashboardPanels'

const AgentsPageClient = dynamic(
  () => import('@/components/app/AgentsPageClient').then((mod) => mod.AgentsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const DeploymentsPageClient = dynamic(
  () => import('@/components/app/DeploymentsPageClient').then((mod) => mod.DeploymentsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const AnalyticsPageClient = dynamic(
  () => import('@/components/dashboard/AnalyticsPageClient').then((mod) => mod.AnalyticsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const ApiKeysPageClient = dynamic(
  () => import('@/components/dashboard/ApiKeysPageClient').then((mod) => mod.ApiKeysPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const AutonomyPageClient = dynamic(
  () => import('@/components/dashboard/AutonomyPageClient').then((mod) => mod.AutonomyPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const BudgetsPageClient = dynamic(
  () => import('@/components/dashboard/BudgetsPageClient').then((mod) => mod.BudgetsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const DocumentsPageClient = dynamic(
  () => import('@/components/dashboard/DocumentsPageClient').then((mod) => mod.DocumentsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const DashboardOverviewPageClient = dynamic(
  () =>
    import('@/components/dashboard/DashboardOverviewPageClient').then(
      (mod) => mod.DashboardOverviewPageClient,
    ),
  { loading: () => <LoadingState variant='detail' count={3} /> },
)
const LogsPageClient = dynamic(
  () => import('@/components/dashboard/LogsPageClient').then((mod) => mod.LogsPageClient),
  { loading: () => <LoadingState variant='rows' count={5} /> },
)
const MonitoringPageClient = dynamic(
  () => import('@/components/dashboard/MonitoringPageClient').then((mod) => mod.MonitoringPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const ObservabilityPageClient = dynamic(
  () =>
    import('@/components/dashboard/ObservabilityPageClient').then(
      (mod) => mod.ObservabilityPageClient,
    ),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const OpenclawSetupSurface = dynamic(
  () =>
    import('@/components/dashboard/control/OpenclawSetupSurface').then(
      (mod) => mod.OpenclawSetupSurface,
    ),
  { loading: () => <LoadingState variant='detail' count={2} /> },
)
const ReasoningPageClient = dynamic(
  () => import('@/components/dashboard/ReasoningPageClient').then((mod) => mod.ReasoningPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const RunsPageClient = dynamic(
  () => import('@/components/dashboard/RunsPageClient').then((mod) => mod.RunsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const SecurityPageClient = dynamic(
  () => import('@/components/dashboard/SecurityPageClient').then((mod) => mod.SecurityPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const SessionsPageClient = dynamic(
  () => import('@/components/dashboard/SessionsPageClient').then((mod) => mod.SessionsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const SkillsPageClient = dynamic(
  () => import('@/components/dashboard/SkillsPageClient').then((mod) => mod.SkillsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const SwarmsPageClient = dynamic(
  () => import('@/components/dashboard/SwarmsPageClient').then((mod) => mod.SwarmsPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const TemplateCatalogPageClient = dynamic(
  () =>
    import('@/components/dashboard/TemplateCatalogPageClient').then(
      (mod) => mod.TemplateCatalogPageClient,
    ),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const TracesPageClient = dynamic(
  () => import('@/components/dashboard/TracesPageClient').then((mod) => mod.TracesPageClient),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)
const WebhooksPageClient = dynamic(
  () => import('@/components/webhooks/WebhooksPageClient'),
  { loading: () => <LoadingState variant='cards' count={3} /> },
)

function ShellRoute({
  title,
  description,
  badge,
  icon: Icon,
  iconTone,
  stats,
  children,
}: {
  title: string
  description: string
  badge: string
  icon: typeof Activity
  iconTone: string
  stats: Array<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' }>
  children: ReactNode
}) {
  return (
    <div className='space-y-4'>
      <RouteHeader
        title={title}
        description={description}
        icon={Icon}
        iconTone={iconTone}
        badge={badge}
        stats={stats}
      />

      {children}
    </div>
  )
}

function UpgradeNudge({
  panel,
  subscription,
}: {
  panel: DashboardPanelId
  subscription: 'free' | 'pro' | 'enterprise' | null
}) {
  return (
    <DashboardSectionPage
      title='Full Mode Required'
      description={`The ${panel} panel is gated in essential mode so the shell stays focused on the core workflow.`}
      badge='essential mode'
      checks={[
        'Switch the interface mode to full once you need the broader Mission Control surface.',
        `Current subscription: ${subscription || 'free'}.`,
        'Essential mode keeps overview, agents, tasks, chat, activity, logs, and settings available.',
      ]}
    />
  )
}

function MissingPanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <DashboardSectionPage
      title={title}
      description={description}
      badge='route scaffold'
      checks={[
        'Keep the shell truthful: no fake notification or standup theater until the contracts exist.',
        'When this route ships, wire it through the same content router instead of creating a separate app shell.',
        'Treat this panel as reserved space, not a design playground.',
      ]}
    />
  )
}

function renderPanel(panel: DashboardPanelId) {
  switch (panel) {
    case 'overview':
      return (
        <ShellRoute
          title='Overview'
          description='Fleet posture, recent execution, alert pressure, delivery health, and operator budget state in one surface.'
          icon={Activity}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='operator overview'
          stats={[
            { label: 'Shell', value: 'Mission Control' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <DashboardOverviewPageClient />
        </ShellRoute>
      )
    case 'agents':
      return (
        <ShellRoute
          title='Agents'
          description='Manage your MUTX agent registry, lifecycle operations, and per-agent configuration.'
          icon={Bot}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='core surface'
          stats={[
            { label: 'Scope', value: 'Fleet registry' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <AgentsPageClient />
        </ShellRoute>
      )
    case 'deployments':
      return (
        <ShellRoute
          title='Deployments'
          description='Operate active MUTX deployments, rollout actions, and runtime-level fleet posture.'
          icon={GitBranchPlus}
          iconTone='text-emerald-400 bg-emerald-400/10'
          badge='core surface'
          stats={[
            { label: 'Scope', value: 'Runtime control' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <DeploymentsPageClient />
        </ShellRoute>
      )
    case 'documents':
      return (
        <ShellRoute
          title='Documents'
          description='Predict-RLM-backed document workflows with managed uploads, local desktop execution, and run-trace linkage.'
          icon={FileText}
          iconTone='text-amber-300 bg-amber-400/10'
          badge='document workflows'
          stats={[
            { label: 'Execution', value: 'Hybrid' },
            { label: 'Artifacts', value: 'Managed storage', tone: 'success' },
          ]}
        >
          <DocumentsPageClient />
        </ShellRoute>
      )
    case 'reasoning':
      return (
        <ShellRoute
          title='Reasoning'
          description='Autoreason refinement jobs with blind judging, persisted artifacts, and direct run-trace linkage.'
          icon={Brain}
          iconTone='text-violet-300 bg-violet-400/10'
          badge='autoreason v1'
          stats={[
            { label: 'Loop', value: 'A/B/AB' },
            { label: 'Judging', value: 'Blind panel', tone: 'success' },
          ]}
        >
          <ReasoningPageClient />
        </ShellRoute>
      )
    case 'runs':
      return (
        <ShellRoute
          title='Runs'
          description='Recent execution history, terminal state, and operator recovery context from the live runs contract.'
          icon={History}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='execution surface'
          stats={[
            { label: 'Scope', value: 'Recent runs' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <RunsPageClient />
        </ShellRoute>
      )
    case 'monitoring':
      return (
        <ShellRoute
          title='Monitoring'
          description='Live health, open alerts, and control-plane status at a glance.'
          icon={BellRing}
          iconTone='text-sky-400 bg-sky-400/10'
          badge='monitoring surface'
          stats={[
            { label: 'Scope', value: 'Health + alerts' },
            { label: 'Source', value: 'Live API', tone: 'success' },
          ]}
        >
          <MonitoringPageClient />
        </ShellRoute>
      )
    case 'activity':
      return (
        <ShellRoute
          title='Activity'
          description='Operational activity, alert pressure, and recent system state in the same shell as runs and governance.'
          icon={Activity}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='activity surface'
          stats={[
            { label: 'Scope', value: 'Events + health' },
            { label: 'Source', value: 'Live API', tone: 'success' },
          ]}
        >
          <MonitoringPageClient />
        </ShellRoute>
      )
    case 'traces':
      return (
        <ShellRoute
          title='Traces'
          description='Correlated event streams anchored to real runs instead of a standalone synthetic log wall.'
          icon={Workflow}
          iconTone='text-sky-300 bg-sky-400/10'
          badge='trace explorer'
          stats={[
            { label: 'Scope', value: 'Run drilldown' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <TracesPageClient />
        </ShellRoute>
      )
    case 'observability':
      return (
        <ShellRoute
          title='Observability'
          description='Agent run observability powered by the MUTX Observability Schema.'
          icon={Radar}
          iconTone='text-emerald-300 bg-emerald-400/10'
          badge='observability surface'
          stats={[
            { label: 'Schema', value: 'MutxRun' },
            { label: 'Source', value: 'agent-run', tone: 'success' },
          ]}
        >
          <ObservabilityPageClient />
        </ShellRoute>
      )
    case 'chat':
      return (
        <ShellRoute
          title='Sessions'
          description='Assistant sessions, channel presence, and OpenClaw gateway availability from the live session contracts.'
          icon={Users}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='session surface'
          stats={[
            { label: 'Scope', value: 'Gateway sessions' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <SessionsPageClient />
        </ShellRoute>
      )
    case 'api-keys':
      return (
        <ShellRoute
          title='API Keys'
          description='Create, rotate, revoke, and inspect operator keys without leaving the dashboard shell.'
          icon={Key}
          iconTone='text-amber-300 bg-amber-400/10'
          badge='credential surface'
          stats={[
            { label: 'Scope', value: 'Keys only' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <ApiKeysPageClient />
        </ShellRoute>
      )
    case 'cost-tracker':
      return (
        <ShellRoute
          title='Budgets'
          description='Credit posture, spend separation, and usage breakdown anchored to the live budget and analytics contracts.'
          icon={Wallet}
          iconTone='text-emerald-300 bg-emerald-400/10'
          badge='cost surface'
          stats={[
            { label: 'Scope', value: 'Credits + usage' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <BudgetsPageClient />
        </ShellRoute>
      )
    case 'webhooks':
      return (
        <ShellRoute
          title='Webhooks'
          description='Manage outbound event endpoints and verify delivery behavior with truthful delivery history.'
          icon={Webhook}
          iconTone='text-fuchsia-300 bg-fuchsia-400/10'
          badge='integration surface'
          stats={[
            { label: 'Scope', value: 'Event delivery' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <WebhooksPageClient />
        </ShellRoute>
      )
    case 'security':
      return (
        <ShellRoute
          title='Security'
          description='Credential inventory, auth posture, and operator trust boundaries in the same surface as deployment and recovery.'
          icon={ShieldCheck}
          iconTone='text-amber-300 bg-amber-400/10'
          badge='security surface'
          stats={[
            { label: 'Scope', value: 'Auth + governance' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <SecurityPageClient />
        </ShellRoute>
      )
    case 'tasks':
      return (
        <DemoRoutePage
          title='Orchestration'
          description='Workflow and handoff control will land here once the backend owns orchestration entities end to end.'
          badge='demo orchestration'
          notes={[
            'Show truthful workflow topology once orchestration endpoints ship instead of inventing queue theater.',
            'Keep pause, resume, and concurrency controls hidden until they map to auditable backend actions.',
            'Use the same shell and density rules as the live routes so this page is ready for backend wiring, not another redesign.',
          ]}
        />
      )
    case 'memory':
      return (
        <DemoRoutePage
          title='Memory'
          description='Memory and context-management need real retention and retrieval contracts before they deserve operator controls.'
          badge='demo memory'
          notes={[
            'Do not ship pretend vector-store or retention controls before the product semantics exist.',
            'This surface should become the place operators inspect memory pressure, retention windows, and context ownership.',
            'Until then, keep the route compact, honest, and visually aligned with the rest of the control plane.',
          ]}
        />
      )
    case 'tokens':
      return (
        <ShellRoute
          title='Analytics'
          description='Usage trends, latency posture, and operator activity summaries from the live analytics contracts.'
          icon={BarChart3}
          iconTone='text-fuchsia-300 bg-fuchsia-400/10'
          badge='analytics surface'
          stats={[
            { label: 'Scope', value: 'Trends + usage' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <AnalyticsPageClient />
        </ShellRoute>
      )
    case 'channels':
      return (
        <DashboardSectionPage
          title='Channels'
          description='Assistant channel shell for bindings, policy mode, and safe communication defaults.'
          badge='assistant channels'
          checks={[
            'Bind this route to mounted assistant channel state once browser panels consume the control-plane contract.',
            'Keep channel enablement and policy views grounded in real backend data.',
            'Use this surface for truthful channel inspection before introducing richer write flows.',
          ]}
        />
      )
    case 'skills':
      return (
        <ShellRoute
          title='Skills'
          description='Pinned Orchestra Research imports, curated bundles, and runtime-ready skill inventory for live assistants.'
          icon={Brain}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='skillpack control'
          stats={[
            { label: 'Catalog', value: 'ClawHub + Orchestra' },
            { label: 'Mode', value: 'Live install', tone: 'success' },
          ]}
        >
          <SkillsPageClient />
        </ShellRoute>
      )
    case 'logs':
      return (
        <ShellRoute
          title='Logs'
          description='Real-time step timeline and execution log for agent runs. Click any run to inspect its step sequence.'
          icon={TerminalSquare}
          iconTone='text-slate-200 bg-white/10'
          badge='execution trace'
          stats={[
            { label: 'Source', value: 'Observability API' },
            { label: 'Data', value: 'Live', tone: 'success' },
          ]}
        >
          <LogsPageClient />
        </ShellRoute>
      )
    case 'settings':
      return (
        <ShellRoute
          title='Settings'
          description='Bridge diagnostics, runtime repair, and setup flow for this operator seat.'
          icon={Network}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='advanced diagnostics'
          stats={[
            { label: 'Scope', value: 'Desktop + runtime' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <OpenclawSetupSurface />
        </ShellRoute>
      )
    case 'cron':
      return (
        <ShellRoute
          title='Autonomy'
          description='Local operator view for the live autonomy daemon, lane state, queue depth, active runners, and recent reports.'
          icon={Bot}
          iconTone='text-fuchsia-300 bg-fuchsia-400/10'
          badge='local autonomy surface'
          stats={[
            { label: 'Source', value: '.autonomy + queue', tone: 'success' },
            { label: 'Scope', value: 'Daemon + lanes + reports' },
          ]}
        >
          <AutonomyPageClient />
        </ShellRoute>
      )
    case 'swarm':
      return (
        <ShellRoute
          title='Swarm'
          description='Grouped agent topology and coordinated replica posture from the live swarm contract.'
          icon={GitBranchPlus}
          iconTone='text-cyan-300 bg-cyan-400/10'
          badge='swarm surface'
          stats={[
            { label: 'Scope', value: 'Grouped agents' },
            { label: 'Data', value: 'Live API', tone: 'success' },
          ]}
        >
          <SwarmsPageClient />
        </ShellRoute>
      )
    case 'templates':
      return (
        <ShellRoute
          title='Templates'
          description='Browse, clone, and deploy MUTX agent starter templates. Custom templates are editable and persisted to your catalog.'
          icon={LayoutGrid}
          iconTone='text-violet-300 bg-violet-400/10'
          badge='workspace'
          stats={[
            { label: 'Scope', value: 'Templates + custom' },
            { label: 'Source', value: 'API + local catalog' },
          ]}
        >
          <TemplateCatalogPageClient />
        </ShellRoute>
      )
    case 'notifications':
      return (
        <MissingPanel
          title='Notifications'
          description='The shell reserves this panel, but MUTX does not ship a truthful notification center yet.'
        />
      )
    case 'standup':
      return (
        <MissingPanel
          title='Standup'
          description='Mission Control expects a standup panel, but MUTX does not have a real standup workflow in this checkout yet.'
        />
      )
  }
}

export function DashboardContentRouter({
  panel,
  interfaceMode,
  subscription,
}: {
  panel: DashboardPanelId
  interfaceMode: InterfaceMode
  subscription: 'free' | 'pro' | 'enterprise' | null
}) {
  if (!isPanelAccessibleInMode(panel, interfaceMode)) {
    return <UpgradeNudge panel={panel} subscription={subscription} />
  }

  return renderPanel(panel)
}
