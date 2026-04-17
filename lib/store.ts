/**
 * lib/store.ts — Global Zustand store for MUTX dashboard (SPA shell).
 *
 * Single store with subscribeWithSelector middleware.
 * Issue #3689 port from mission-control.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface MCUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface Session {
  id: string;
  key: string;
  agent_id?: string;
  channel?: string;
  kind: string;
  age: number;
  model: string;
  tokens: number;
  flags: string[];
  active: boolean;
  startTime?: string;
  lastActivity?: string;
  messageCount?: number;
  cost?: number;
  label?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  session?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CronJob {
  id?: string;
  name: string;
  schedule: string;
  command: string;
  model?: string;
  agentId?: string;
  timezone?: string;
  delivery?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastStatus?: string;
  lastError?: string;
}

export type AgentStatus = "offline" | "idle" | "busy" | "error";

export interface MCAgent {
  id: string;
  name: string;
  role: string;
  session_key?: string;
  soul_content?: string;
  working_memory?: string;
  status: AgentStatus;
  timestamps: {
    created_at?: string;
    updated_at?: string;
  };
  hidden?: boolean;
  config?: Record<string, unknown>;
  taskStats?: {
    total?: number;
    pending?: number;
    done?: number;
    failed?: number;
  };
}

export type TaskStatus =
  | "backlog"
  | "inbox"
  | "assigned"
  | "awaiting_owner"
  | "in_progress"
  | "review"
  | "quality_review"
  | "done"
  | "failed";

export type TaskPriority = "low" | "medium" | "high" | "urgent" | "critical";

export interface MCTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id?: string;
  assigned_to?: string;
  created_by: string;
  timestamps: {
    created_at?: string;
    updated_at?: string;
    completed_at?: string;
  };
  github?: {
    repo?: string;
    issue_number?: number;
    pr_number?: number;
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MCActivity {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  description: string;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface MCNotification {
  id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  source_type?: string;
  source_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface MemoryFile {
  path: string;
  name: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
  children?: MemoryFile[];
}

export interface TokenUsage {
  model: string;
  sessionId: string;
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  from_agent: string;
  to_agent: string;
  content: string;
  message_type: string;
  metadata?: Record<string, unknown>;
  attachments?: unknown[];
  created_at: string;
}

export interface Conversation {
  id: string;
  name?: string;
  kind?: string;
  source?: "chat" | "session";
  session?: Session;
}

export interface Subscription {
  plan: string;
  tier: string;
  billing_cycle: string;
  expires_at?: string;
}

export interface SkillsData {
  installed: string[];
  available: string[];
  categories: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------

export interface ConnectionState {
  isConnected: boolean;
  sseConnected: boolean;
  wsConnected: boolean;
}

// ---------------------------------------------------------------------------
// Boot step tracking
// ---------------------------------------------------------------------------

export type BootStepKey =
  | "auth"
  | "capabilities"
  | "config"
  | "connect"
  | "agents"
  | "sessions"
  | "projects"
  | "memory"
  | "skills";

export const STEP_KEYS: BootStepKey[] = [
  "auth",
  "capabilities",
  "config",
  "connect",
  "agents",
  "sessions",
  "projects",
  "memory",
  "skills",
];

export interface BootState {
  completedSteps: Record<string, boolean>;
  errors: Partial<Record<BootStepKey, string>>;
}

// ---------------------------------------------------------------------------
// Dashboard / interface modes
// ---------------------------------------------------------------------------

export type DashboardMode = "local" | "gateway";
export type InterfaceMode = "essential" | "full";

// ---------------------------------------------------------------------------
// Tab / panel routing
// ---------------------------------------------------------------------------

export type TabId =
  | "overview"
  | "agents"
  | "tasks"
  | "chat"
  | "activity"
  | "logs"
  | "cron"
  | "memory"
  | "skills"
  | "settings"
  | "tokens"
  | "cost-tracker"
  | "webhooks"
  | "security";

/** Tabs accessible in essential mode */
export const ESSENTIAL_PANELS: TabId[] = [
  "overview",
  "agents",
  "tasks",
  "chat",
  "activity",
  "logs",
  "settings",
];

// ---------------------------------------------------------------------------
// Full store state shape
// ---------------------------------------------------------------------------

export interface MissionControlState {
  // ── Navigation ──────────────────────────────────────────────────────────
  activeTab: TabId;
  liveFeedOpen: boolean;
  chatPanelOpen: boolean;

  // ── Auth ─────────────────────────────────────────────────────────────────
  currentUser: MCUser | null;

  // ── Mode ──────────────────────────────────────────────────────────────────
  dashboardMode: DashboardMode;
  interfaceMode: InterfaceMode;

  // ── Connection ───────────────────────────────────────────────────────────
  connection: ConnectionState;

  // ── Boot ─────────────────────────────────────────────────────────────────
  bootComplete: boolean;
  capabilitiesChecked: boolean;
  bootState: BootState;

  // ── Subscription / config ───────────────────────────────────────────────
  subscription: Subscription | null;

  // ── Data slices ──────────────────────────────────────────────────────────
  agents: MCAgent[];
  sessions: Session[];
  projects: MCTask[];
  tasks: MCTask[];
  activities: MCActivity[];
  notifications: MCNotification[];
  logs: LogEntry[];
  cronJobs: CronJob[];
  tokenUsage: TokenUsage[];
  skillsData: SkillsData | null;

  // ── Memory ────────────────────────────────────────────────────────────────
  memoryGraphAgents: MCAgent[];
}

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

export interface MissionControlActions {
  // Navigation
  setActiveTab: (tab: TabId) => void;
  toggleLiveFeed: () => void;
  setLiveFeedOpen: (open: boolean) => void;
  setChatPanelOpen: (open: boolean) => void;

  // Auth
  setCurrentUser: (user: MCUser | null) => void;

  // Mode
  setDashboardMode: (mode: DashboardMode) => void;
  setInterfaceMode: (mode: InterfaceMode) => void;

  // Connection
  setConnection: (connection: Partial<ConnectionState>) => void;

  // Boot
  markStepComplete: (step: BootStepKey) => void;
  markStepError: (step: BootStepKey, error: string) => void;
  setBootComplete: (complete: boolean) => void;
  setCapabilitiesChecked: (checked: boolean) => void;

  // Subscription / config
  setSubscription: (sub: Subscription | null) => void;

  // Data setters
  setAgents: (agents: MCAgent[]) => void;
  setSessions: (sessions: Session[]) => void;
  setProjects: (projects: MCTask[]) => void;
  setTasks: (tasks: MCTask[]) => void;
  setActivities: (activities: MCActivity[]) => void;
  setNotifications: (notifications: MCNotification[]) => void;
  setLogs: (logs: LogEntry[]) => void;
  setCronJobs: (jobs: CronJob[]) => void;
  setTokenUsage: (usage: TokenUsage[]) => void;
  setSkillsData: (data: SkillsData | null) => void;

  // Memory
  setMemoryGraphAgents: (agents: MCAgent[]) => void;

  // Convenience fetch helpers (run API call + set state)
  fetchAgents: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  fetchCronJobs: () => Promise<void>;
  fetchSkillsData: () => Promise<void>;
}

export type MissionControlStore = MissionControlState & MissionControlActions;

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const _initialState: MissionControlState = {
  activeTab: "overview",
  liveFeedOpen: true,
  chatPanelOpen: false,
  currentUser: null,
  dashboardMode: "gateway",
  interfaceMode: "full",
  connection: { isConnected: false, sseConnected: false, wsConnected: false },
  bootComplete: false,
  capabilitiesChecked: false,
  bootState: { completedSteps: {}, errors: {} },
  subscription: null,
  agents: [],
  sessions: [],
  projects: [],
  tasks: [],
  activities: [],
  notifications: [],
  logs: [],
  cronJobs: [],
  tokenUsage: [],
  skillsData: null,
  memoryGraphAgents: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMissionControl = create<MissionControlStore>()(
  subscribeWithSelector((set, get) => ({
  // Navigation
  setActiveTab: (tab: TabId) => set({ activeTab: tab }),
  toggleLiveFeed: () => set((s) => ({ liveFeedOpen: !s.liveFeedOpen })),
  setLiveFeedOpen: (open: boolean) => set({ liveFeedOpen: open }),
  setChatPanelOpen: (open: boolean) => set({ chatPanelOpen: open }),

  // Auth
  setCurrentUser: (user: MCUser | null) => set({ currentUser: user }),

  // Mode
  setDashboardMode: (mode: DashboardMode) => set({ dashboardMode: mode }),
  setInterfaceMode: (mode: InterfaceMode) => set({ interfaceMode: mode }),

  // Connection
  setConnection: (partial: Partial<ConnectionState>) =>
      set((s) => ({ connection: { ...s.connection, ...partial } })),

    // Boot
    markStepComplete: (step: BootStepKey) =>
      set((s) => ({
        bootState: {
          ...s.bootState,
          completedSteps: { ...s.bootState.completedSteps, [step]: true },
        },
      })),

    markStepError: (step: BootStepKey, error: string) =>
      set((s) => ({
        bootState: {
          ...s.bootState,
          errors: { ...s.bootState.errors, [step]: error },
        },
      })),

    setBootComplete: (complete: boolean) => set({ bootComplete: complete }),
    setCapabilitiesChecked: (checked: boolean) => set({ capabilitiesChecked: checked }),

    // Subscription / config
    setSubscription: (sub: Subscription | null) => set({ subscription: sub }),

    // Data setters
    setAgents: (agents: MCAgent[]) => set({ agents }),
    setSessions: (sessions: Session[]) => set({ sessions }),
    setProjects: (projects: MCTask[]) => set({ projects }),
    setTasks: (tasks: MCTask[]) => set({ tasks }),
    setActivities: (activities: MCActivity[]) => set({ activities }),
    setNotifications: (notifications: MCNotification[]) => set({ notifications }),
    setLogs: (logs: LogEntry[]) => set({ logs }),
    setCronJobs: (jobs: CronJob[]) => set({ cronJobs: jobs }),
    setTokenUsage: (usage: TokenUsage[]) => set({ tokenUsage: usage }),
    setSkillsData: (data: SkillsData | null) => set({ skillsData: data }),

    // Memory
    setMemoryGraphAgents: (agents: MCAgent[]) => set({ memoryGraphAgents: agents }),

    // ── Convenience fetch helpers ───────────────────────────────────────────
    fetchAgents: async () => {
      try {
        const res = await fetch("/api/dashboard/agents", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { items: MCAgent[] };
          get().setAgents(data.items ?? []);
        }
      } catch {
        // Agent fetch failed — leave existing data
      }
    },

    fetchSessions: async () => {
      try {
        const res = await fetch("/v1/sessions", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { items: Session[] };
          get().setSessions(data.items ?? []);
        }
      } catch {
        // Session fetch failed — leave existing data
      }
    },

    fetchActivities: async () => {
      try {
        const res = await fetch("/v1/activities", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { items: MCActivity[] };
          get().setActivities(data.items ?? []);
        }
      } catch {
        // Activity fetch failed — leave existing data
      }
    },

    fetchLogs: async () => {
      try {
        const res = await fetch("/v1/logs", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { items: LogEntry[] };
          get().setLogs(data.items ?? []);
        }
      } catch {
        // Log fetch failed — leave existing data
      }
    },

    fetchCronJobs: async () => {
      try {
        const res = await fetch("/v1/cron", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { items: CronJob[] };
          get().setCronJobs(data.items ?? []);
        }
      } catch {
        // Cron fetch failed — leave existing data
      }
    },

    fetchSkillsData: async () => {
      try {
        const res = await fetch("/v1/skills", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as SkillsData;
          get().setSkillsData(data);
        }
      } catch {
        // Skills fetch failed — leave existing data
      }
    },
  } as unknown as MissionControlStore))
);

// ---------------------------------------------------------------------------
// Feature flag helpers
// ---------------------------------------------------------------------------

/** Returns true when NEXT_PUBLIC_SPA_SHELL=true */
export function isSpaShellEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_SPA_SHELL === "true";
}
