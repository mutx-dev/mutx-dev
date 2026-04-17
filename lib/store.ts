'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Domain Interfaces — ported from mission-control src/store/index.ts
// Adapted for MUTX /v1/* API surface and existing dashboard routes.
// ---------------------------------------------------------------------------

export type AgentStatus = 'offline' | 'idle' | 'busy' | 'error'
export type TaskStatus =
  | 'backlog'
  | 'inbox'
  | 'assigned'
  | 'awaiting_owner'
  | 'in_progress'
  | 'review'
  | 'quality_review'
  | 'done'
  | 'failed'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'trivial'
export type DashboardStatus = 'idle' | 'running' | 'success' | 'error' | 'warning'
export type RunFlowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_owner'
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type InterfaceMode = 'essential' | 'full'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type BootStepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'
export type BootStepKey =
  | 'auth'
  | 'capabilities'
  | 'config'
  | 'connect'
  | 'agents'
  | 'sessions'
  | 'projects'
  | 'memory'
  | 'skills'

export interface CurrentUser {
  id: string
  username: string
  display_name: string
  role: 'admin' | 'operator' | 'viewer'
  workspace_id?: string
  tenant_id?: string
  provider?: string
  email?: string
  avatar_url?: string
}

export interface Agent {
  id: string
  name: string
  role: string
  session_key?: string
  soul_content?: string
  working_memory?: string
  status: AgentStatus
  last_seen?: string
  last_activity?: string
  created_at: string
  updated_at: string
  hidden?: boolean
  config?: Record<string, unknown>
  taskStats?: { total: number; completed: number; failed: number }
}

export interface Session {
  id: string
  key: string
  agent?: string
  channel?: string
  kind: string
  age: number
  model?: string
  tokens?: number
  flags: string[]
  active: boolean
  startTime?: string
  lastActivity?: string
  messageCount?: number
  cost?: number
  label?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  project_id?: string
  assigned_to?: string
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  tags?: string[]
  github_issue_number?: number
  github_repo?: string
  github_status?: string
  metadata?: Record<string, unknown>
}

export interface Activity {
  id: string
  type: string
  entity_type: string
  entity_id: string
  actor: string
  description: string
  data?: Record<string, unknown>
  created_at: string
  entity?: { type: string; id: string; title?: string; name?: string; status?: string }
}

export interface Notification {
  id: string
  recipient: string
  type: string
  title: string
  message: string
  source_type?: string
  source_id?: string
  read_at?: string
  delivered_at?: string
  created_at: string
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  source: string
  session?: string
  message: string
  data?: Record<string, unknown>
}

export interface Run {
  id: string
  agent_id?: string
  status: RunFlowStatus
  model?: string
  input_tokens?: number
  output_tokens?: number
  cost?: number
  started_at?: string
  completed_at?: string
  error?: string
  traces?: TraceEntry[]
}

export interface TraceEntry {
  id: string
  run_id: string
  step: number
  type: string
  name: string
  input?: unknown
  output?: unknown
  duration_ms?: number
  timestamp: string
}

export interface Deployment {
  id: string
  agent_id: string
  status: DashboardStatus
  version?: string
  created_at: string
  updated_at: string
  config?: Record<string, unknown>
}

export interface Budget {
  id: string
  name: string
  limit: number
  spent: number
  period: string
  agent_id?: string
  created_at: string
  alert_threshold?: number
}

export interface MonitoringAlert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  source?: string
  acknowledged: boolean
  created_at: string
  resolved_at?: string
}

export interface AnalyticsSummary {
  total_agents: number
  active_sessions: number
  total_runs: number
  total_cost: number
  total_tokens: number
  period: string
}

export interface OverviewData {
  agents: { total: number; active: number; idle: number; error: number }
  sessions: { total: number; active: number }
  runs: { total: number; pending: number; running: number; completed: number; failed: number }
  costs: { today: number; week: number; month: number }
}

export interface ConnectionStatus {
  isConnected: boolean
  url?: string
  lastConnected?: string
  reconnectAttempts: number
  latency?: number
  sseConnected?: boolean
}

export interface QueueDepthEntry {
  status: RunFlowStatus
  count: number
  label: string
}

export interface FlowStage {
  status: RunFlowStatus
  count: number
  maxCount: number
}

export type BootStepState = Record<BootStepKey, BootStepStatus>

function createInitialBootSteps(): BootStepState {
  return {
    auth: 'pending',
    capabilities: 'pending',
    config: 'pending',
    connect: 'pending',
    agents: 'pending',
    sessions: 'pending',
    projects: 'pending',
    memory: 'pending',
    skills: 'pending',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return null
}

function normalizeCurrentUser(payload: unknown): CurrentUser | null {
  if (!isRecord(payload)) {
    return null
  }

  const user = isRecord(payload.user) ? payload.user : payload
  const id = pickString(user, ['id', 'user_id', 'sub'])
  const username = pickString(user, ['username', 'email', 'display_name', 'name'])

  if (!id || !username) {
    return null
  }

  return {
    id,
    username,
    display_name: pickString(user, ['display_name', 'name', 'username']) || username,
    role: (pickString(user, ['role']) as CurrentUser['role'] | null) || 'operator',
    workspace_id: pickString(user, ['workspace_id', 'workspace']) ?? undefined,
    tenant_id: pickString(user, ['tenant_id', 'organization_id']) ?? undefined,
    provider: pickString(user, ['provider']) ?? undefined,
    email: pickString(user, ['email']) ?? undefined,
    avatar_url: pickString(user, ['avatar_url', 'avatar']) ?? undefined,
  }
}

function normalizeSubscription(payload: unknown): MissionControlState['subscription'] {
  const normalizePlan = (plan: string | null | undefined): SubscriptionPlan | null => {
    if (!plan) {
      return null
    }

    const normalized = plan.trim().toLowerCase()
    if (
      normalized === 'free' ||
      normalized === 'starter' ||
      normalized === 'pro' ||
      normalized === 'enterprise'
    ) {
      return normalized
    }

    return null
  }

  if (typeof payload === 'string') {
    return normalizePlan(payload)
  }

  if (!isRecord(payload)) {
    return null
  }

  if (typeof payload.subscription === 'string') {
    return normalizePlan(payload.subscription)
  }

  const source = isRecord(payload.subscription) ? payload.subscription : payload
  const plan = pickString(source, ['plan', 'tier', 'status'])

  return normalizePlan(plan)
}

function normalizeInterfaceMode(payload: unknown): InterfaceMode | null {
  if (!isRecord(payload)) {
    return null
  }

  const value = pickString(payload, ['interfaceMode', 'interface_mode'])
  return value === 'essential' || value === 'full' ? value : null
}

function normalizeOrgName(payload: unknown) {
  if (!isRecord(payload)) {
    return null
  }

  return pickString(payload, ['orgName', 'org_name'])
}

// ---------------------------------------------------------------------------
// Store State Shape
// ---------------------------------------------------------------------------

export interface MissionControlState {
  // -- Auth --
  currentUser: CurrentUser | null

  // -- Connection --
  connection: ConnectionStatus
  lastMessage: unknown | null

  // -- Boot --
  bootStarted: boolean
  booting: boolean
  bootComplete: boolean
  bootSteps: BootStepState
  bootErrors: Partial<Record<BootStepKey, string>>
  capabilitiesChecked: boolean
  dashboardMode: 'local' | 'gateway'
  interfaceMode: InterfaceMode
  subscription: SubscriptionPlan | null
  orgName: string | null

  // -- Agents --
  agents: Agent[]
  selectedAgent: Agent | null

  // -- Sessions --
  sessions: Session[]
  selectedSession: Session | null

  // -- Runs --
  runs: Run[]

  // -- Tasks --
  tasks: Task[]
  selectedTask: Task | null

  // -- Activities --
  activities: Activity[]

  // -- Notifications --
  notifications: Notification[]
  unreadNotificationCount: number

  // -- Logs --
  logs: LogEntry[]
  logFilters: { level?: LogLevel; source?: string; session?: string }

  // -- Deployments --
  deployments: Deployment[]

  // -- Budgets --
  budgets: Budget[]

  // -- Monitoring --
  monitoringAlerts: MonitoringAlert[]

  // -- Analytics --
  analyticsSummary: AnalyticsSummary | null
  overview: OverviewData | null

  // -- UI State --
  activeTab: string
  sidebarExpanded: boolean
  collapsedGroups: string[]
  liveFeedOpen: boolean
  chatPanelOpen: boolean
  headerDensity: 'compact' | 'normal' | 'comfortable'
  dashboardLayout: string[] | null

  // -- Update availability --
  updateAvailable: string | null
  updateDismissedVersion: string | null
  bannerDismissed: boolean
}

// ---------------------------------------------------------------------------
// Store Actions
// ---------------------------------------------------------------------------

export interface MissionControlActions {
  // -- Auth --
  setCurrentUser: (user: CurrentUser | null) => void

  // -- Connection --
  setConnection: (status: Partial<ConnectionStatus>) => void
  setLastMessage: (msg: unknown) => void

  // -- Boot --
  setBootStarted: (started: boolean) => void
  setBooting: (booting: boolean) => void
  setBootComplete: (complete: boolean) => void
  setBootStepStatus: (
    step: BootStepKey,
    status: BootStepStatus,
    error?: string | null
  ) => void
  setCapabilitiesChecked: (checked: boolean) => void
  setDashboardMode: (mode: 'local' | 'gateway') => void
  setInterfaceMode: (mode: InterfaceMode) => void
  setSubscription: (sub: SubscriptionPlan | null) => void
  setOrgName: (name: string | null) => void

  // -- Agents --
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void

  // -- Sessions --
  setSessions: (sessions: Session[]) => void
  setSelectedSession: (session: Session | null) => void
  updateSession: (key: string, updates: Partial<Session>) => void

  // -- Runs --
  setRuns: (runs: Run[]) => void

  // -- Tasks --
  setTasks: (tasks: Task[]) => void
  setSelectedTask: (task: Task | null) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // -- Activities --
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => void

  // -- Notifications --
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // -- Logs --
  addLog: (entry: LogEntry) => void
  setLogFilters: (filters: Partial<MissionControlState['logFilters']>) => void
  clearLogs: () => void

  // -- Deployments --
  setDeployments: (deployments: Deployment[]) => void

  // -- Budgets --
  setBudgets: (budgets: Budget[]) => void

  // -- Monitoring --
  setMonitoringAlerts: (alerts: MonitoringAlert[]) => void

  // -- Analytics --
  setAnalyticsSummary: (summary: AnalyticsSummary | null) => void
  setOverview: (overview: OverviewData | null) => void

  // -- UI --
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  toggleGroup: (group: string) => void
  toggleLiveFeed: () => void
  setChatPanelOpen: (open: boolean) => void
  setHeaderDensity: (density: MissionControlState['headerDensity']) => void
  setDashboardLayout: (layout: string[] | null) => void

  // -- Update --
  setUpdateAvailable: (version: string | null) => void
  dismissUpdate: () => void
  dismissBanner: () => void

  // -- Async fetch actions --
  fetchAgents: () => Promise<void>
  fetchSessions: () => Promise<void>
  fetchRuns: () => Promise<void>
  fetchOverview: () => Promise<void>
  fetchAnalyticsSummary: () => Promise<void>
  fetchMonitoringAlerts: () => Promise<void>
  fetchBudgets: () => Promise<void>
  fetchDeployments: () => Promise<void>

  // -- Boot sequence --
  boot: () => Promise<void>
}

// ---------------------------------------------------------------------------
// localStorage helpers — prefix 'mutx-' to avoid collision with MC's 'mc-'
// ---------------------------------------------------------------------------

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(`mutx-${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`mutx-${key}`, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable — silent degrade
  }
}

// ---------------------------------------------------------------------------
// Store definition
// ---------------------------------------------------------------------------

export type MissionControlStore = MissionControlState & MissionControlActions

export const useMissionControl = create<MissionControlStore>()(
  subscribeWithSelector((set, get) => ({
    // ===== Initial state =====

    // Auth
    currentUser: null,

    // Connection
    connection: {
      isConnected: false,
      reconnectAttempts: 0,
      sseConnected: false,
    },
    lastMessage: null,

    // Boot
    bootStarted: false,
    booting: false,
    bootComplete: false,
    bootSteps: createInitialBootSteps(),
    bootErrors: {},
    capabilitiesChecked: false,
    dashboardMode: 'local',
    interfaceMode: loadFromLocalStorage<InterfaceMode>('interface-mode', 'full'),
    subscription: null,
    orgName: null,

    // Agents
    agents: [],
    selectedAgent: null,

    // Sessions
    sessions: [],
    selectedSession: null,

    // Runs
    runs: [],

    // Tasks
    tasks: [],
    selectedTask: null,

    // Activities
    activities: [],

    // Notifications
    notifications: [],
    unreadNotificationCount: 0,

    // Logs
    logs: [],
    logFilters: {},

    // Deployments
    deployments: [],

    // Budgets
    budgets: [],

    // Monitoring
    monitoringAlerts: [],

    // Analytics
    analyticsSummary: null,
    overview: null,

    // UI — hydrate from localStorage
    activeTab: 'overview',
    sidebarExpanded: loadFromLocalStorage('sidebar-expanded', true),
    collapsedGroups: loadFromLocalStorage<string[]>('sidebar-groups', []),
    liveFeedOpen: loadFromLocalStorage('livefeed-open', false),
    chatPanelOpen: false,
    headerDensity: loadFromLocalStorage<MissionControlState['headerDensity']>(
      'header-density',
      'normal'
    ),
    dashboardLayout: loadFromLocalStorage<string[] | null>('dashboard-layout', null),

    // Update
    updateAvailable: null,
    updateDismissedVersion: null,
    bannerDismissed: loadFromLocalStorage('banner-dismissed', false),

    // ===== Actions =====

    // -- Auth --
    setCurrentUser: (user) => set({ currentUser: user }),

    // -- Connection --
    setConnection: (status) =>
      set((state) => ({ connection: { ...state.connection, ...status } })),
    setLastMessage: (msg) => set({ lastMessage: msg }),

    // -- Boot --
    setBootStarted: (started) => set({ bootStarted: started }),
    setBooting: (booting) => set({ booting }),
    setBootComplete: (complete) => set({ bootComplete: complete }),
    setBootStepStatus: (step, status, error) =>
      set((state) => ({
        bootSteps: { ...state.bootSteps, [step]: status },
        bootErrors:
          error === undefined
            ? state.bootErrors
            : error
              ? { ...state.bootErrors, [step]: error }
              : Object.fromEntries(
                  Object.entries(state.bootErrors).filter(([key]) => key !== step)
                ) as Partial<Record<BootStepKey, string>>,
      })),
    setCapabilitiesChecked: (checked) => set({ capabilitiesChecked: checked }),
    setDashboardMode: (mode) => set({ dashboardMode: mode }),
    setInterfaceMode: (mode) => {
      saveToLocalStorage('interface-mode', mode)
      set({ interfaceMode: mode })
      void fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interface_mode: mode }),
      }).catch(() => undefined)
    },
    setSubscription: (sub) => set({ subscription: sub }),
    setOrgName: (name) => set({ orgName: name }),

    // -- Agents --
    setAgents: (agents) => set({ agents }),
    setSelectedAgent: (agent) => set({ selectedAgent: agent }),
    addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
    updateAgent: (id, updates) =>
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        selectedAgent:
          state.selectedAgent?.id === id
            ? { ...state.selectedAgent, ...updates }
            : state.selectedAgent,
      })),
    deleteAgent: (id) =>
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
      })),

    // -- Sessions --
    setSessions: (sessions) => set({ sessions }),
    setSelectedSession: (session) => set({ selectedSession: session }),
    updateSession: (key, updates) =>
      set((state) => ({
        sessions: state.sessions.map((s) => (s.key === key ? { ...s, ...updates } : s)),
        selectedSession:
          state.selectedSession?.key === key
            ? { ...state.selectedSession, ...updates }
            : state.selectedSession,
      })),

    // -- Runs --
    setRuns: (runs) => set({ runs }),

    // -- Tasks --
    setTasks: (tasks) => set({ tasks }),
    setSelectedTask: (task) => set({ selectedTask: task }),
    addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
    updateTask: (id, updates) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        selectedTask:
          state.selectedTask?.id === id
            ? { ...state.selectedTask, ...updates }
            : state.selectedTask,
      })),
    deleteTask: (id) =>
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
      })),

    // -- Activities --
    setActivities: (activities) => set({ activities }),
    addActivity: (activity) =>
      set((state) => ({ activities: [activity, ...state.activities] })),

    // -- Notifications --
    setNotifications: (notifications) =>
      set({
        notifications,
        unreadNotificationCount: notifications.filter((n) => !n.read_at).length,
      }),
    addNotification: (notification) =>
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadNotificationCount: notification.read_at
          ? state.unreadNotificationCount
          : state.unreadNotificationCount + 1,
      })),
    markNotificationRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
      })),
    markAllNotificationsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
        unreadNotificationCount: 0,
      })),

    // -- Logs --
    addLog: (entry) =>
      set((state) => ({ logs: [...state.logs, entry] })),
    setLogFilters: (filters) =>
      set((state) => ({ logFilters: { ...state.logFilters, ...filters } })),
    clearLogs: () => set({ logs: [] }),

    // -- Deployments --
    setDeployments: (deployments) => set({ deployments }),

    // -- Budgets --
    setBudgets: (budgets) => set({ budgets }),

    // -- Monitoring --
    setMonitoringAlerts: (alerts) => set({ monitoringAlerts: alerts }),

    // -- Analytics --
    setAnalyticsSummary: (summary) => set({ analyticsSummary: summary }),
    setOverview: (overview) => set({ overview }),

    // -- UI --
    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleSidebar: () =>
      set((state) => {
        const expanded = !state.sidebarExpanded
        saveToLocalStorage('sidebar-expanded', expanded)
        return { sidebarExpanded: expanded }
      }),
    setSidebarExpanded: (expanded) => {
      saveToLocalStorage('sidebar-expanded', expanded)
      set({ sidebarExpanded: expanded })
    },
    toggleGroup: (group) =>
      set((state) => {
        const groups = new Set(state.collapsedGroups)
        if (groups.has(group)) groups.delete(group)
        else groups.add(group)
        const arr = Array.from(groups)
        saveToLocalStorage('sidebar-groups', arr)
        return { collapsedGroups: arr }
      }),
    toggleLiveFeed: () =>
      set((state) => {
        const open = !state.liveFeedOpen
        saveToLocalStorage('livefeed-open', open)
        return { liveFeedOpen: open }
      }),
    setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
    setHeaderDensity: (density) => {
      saveToLocalStorage('header-density', density)
      set({ headerDensity: density })
    },
    setDashboardLayout: (layout) => {
      saveToLocalStorage('dashboard-layout', layout)
      set({ dashboardLayout: layout })
    },

    // -- Update --
    setUpdateAvailable: (version) => set({ updateAvailable: version }),
    dismissUpdate: () =>
      set((state) => ({ updateDismissedVersion: state.updateAvailable })),
    dismissBanner: () => {
      saveToLocalStorage('banner-dismissed', true)
      set({ bannerDismissed: true })
    },

    // ===== Async fetch actions =====
    // These call the existing /api/dashboard/* proxy routes.

    fetchAgents: async () => {
      try {
        const res = await fetch('/api/dashboard/agents')
        if (!res.ok) return
        const data = await res.json()
        set({ agents: Array.isArray(data) ? data : data.agents ?? data.data ?? [] })
      } catch {
        // Network error — silent degrade, components show stale data
      }
    },

    fetchSessions: async () => {
      try {
        const res = await fetch('/api/dashboard/sessions')
        if (!res.ok) return
        const data = await res.json()
        set({ sessions: Array.isArray(data) ? data : data.sessions ?? data.data ?? [] })
      } catch {
        // silent
      }
    },

    fetchRuns: async () => {
      try {
        const res = await fetch('/api/dashboard/runs')
        if (!res.ok) return
        const data = await res.json()
        set({ runs: Array.isArray(data) ? data : data.runs ?? data.data ?? [] })
      } catch {
        // silent
      }
    },

    fetchOverview: async () => {
      try {
        const res = await fetch('/api/dashboard/overview')
        if (!res.ok) return
        const data = await res.json()
        set({ overview: data })
      } catch {
        // silent
      }
    },

    fetchAnalyticsSummary: async () => {
      try {
        const res = await fetch('/api/dashboard/analytics/summary')
        if (!res.ok) return
        const data = await res.json()
        set({ analyticsSummary: data })
      } catch {
        // silent
      }
    },

    fetchMonitoringAlerts: async () => {
      try {
        const res = await fetch('/api/dashboard/monitoring/alerts')
        if (!res.ok) return
        const data = await res.json()
        set({ monitoringAlerts: Array.isArray(data) ? data : data.alerts ?? data.data ?? [] })
      } catch {
        // silent
      }
    },

    fetchBudgets: async () => {
      try {
        const res = await fetch('/api/dashboard/budgets')
        if (!res.ok) return
        const data = await res.json()
        set({ budgets: Array.isArray(data) ? data : data.budgets ?? data.data ?? [] })
      } catch {
        // silent
      }
    },

    fetchDeployments: async () => {
      try {
        const res = await fetch('/api/dashboard/deployments')
        if (!res.ok) return
        const data = await res.json()
        set({
          deployments: Array.isArray(data) ? data : data.deployments ?? data.data ?? [],
        })
      } catch {
        // silent
      }
    },

    // ===== Boot sequence =====
    // Progress-tracked boot flow for the SPA shell.
    boot: async () => {
      const state = get()
      if (state.booting || state.bootComplete) return

      set({
        bootStarted: true,
        booting: true,
        bootComplete: false,
        bootSteps: createInitialBootSteps(),
        bootErrors: {},
      })

      const runStep = async (step: BootStepKey, action: () => Promise<void>) => {
        get().setBootStepStatus(step, 'running', null)

        try {
          await action()
          get().setBootStepStatus(step, 'success', null)
        } catch (error) {
          get().setBootStepStatus(
            step,
            'error',
            error instanceof Error ? error.message : 'Boot step failed'
          )
        }
      }

      try {
        await runStep('auth', async () => {
          const response = await fetch('/api/auth/me', { cache: 'no-store' })
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              set({ currentUser: null })
              return
            }

            throw new Error('Failed to load operator session')
          }

          const payload = await response.json().catch(() => null)
          set({ currentUser: normalizeCurrentUser(payload) })
        })

        await runStep('capabilities', async () => {
          const desktopMode =
            typeof window !== 'undefined' && Boolean(window.mutxDesktop?.isDesktop)
              ? 'local'
              : 'gateway'

          set({
            dashboardMode: desktopMode,
            capabilitiesChecked: true,
          })
        })

        await runStep('config', async () => {
          const response = await fetch('/api/settings', { cache: 'no-store' })
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              return
            }

            throw new Error('Failed to load dashboard settings')
          }

          const payload = await response.json().catch(() => null)
          if (!isRecord(payload)) {
            return
          }

          const interfaceMode = normalizeInterfaceMode(payload)
          if (interfaceMode) {
            saveToLocalStorage('interface-mode', interfaceMode)
            set({ interfaceMode })
          }

          get().setSubscription(normalizeSubscription(payload))
          set({
            orgName: normalizeOrgName(payload),
          })
        })

        await runStep('connect', async () => {
          set((currentState) => ({
            connection: {
              ...currentState.connection,
              isConnected: false,
              sseConnected: false,
            },
          }))
        })

        const results = await Promise.allSettled([
          runStep('agents', async () => {
            await get().fetchAgents()
          }),
          runStep('sessions', async () => {
            await get().fetchSessions()
          }),
          runStep('projects', async () => {
            const response = await fetch('/api/dashboard/projects', { cache: 'no-store' })
            if (!response.ok) {
              throw new Error('Failed to preload projects')
            }
          }),
          runStep('memory', async () => {
            const response = await fetch('/api/dashboard/memory', { cache: 'no-store' })
            if (!response.ok) {
              throw new Error('Failed to preload memory state')
            }
          }),
          runStep('skills', async () => {
            await Promise.allSettled([
              fetch('/api/dashboard/clawhub/skills', { cache: 'no-store' }),
              fetch('/api/dashboard/clawhub/bundles', { cache: 'no-store' }),
              fetch('/api/dashboard/assistant/overview', { cache: 'no-store' }),
            ])
          }),
        ])

        const failed = results.filter((result) => result.status === 'rejected')
        if (failed.length > 0 && typeof window !== 'undefined') {
          console.warn(`[MUTX Store] Boot finished with ${failed.length} rejected step promise(s)`)
        }
      } finally {
        set({
          booting: false,
          bootComplete: true,
        })
      }
    },
  }))
)
