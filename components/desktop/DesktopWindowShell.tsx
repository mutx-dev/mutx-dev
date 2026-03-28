"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  FolderOpen,
  History,
  Layers,
  LayoutPanelLeft,
  MessagesSquare,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  TerminalSquare,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";

import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";
import type { DesktopWindowPayload } from "@/components/desktop/types";
import { cn } from "@/lib/utils";

type WorkspacePane =
  | "overview"
  | "fleet"
  | "rollouts"
  | "operations"
  | "monitoring"
  | "api-keys"
  | "budgets"
  | "analytics"
  | "webhooks"
  | "security"
  | "automation"
  | "memory"
  | "swarm"
  | "channels"
  | "history"
  | "skills"
  | "spawn"
  | "logs";

type SettingsPane = "account" | "runtime" | "gateway" | "governance" | "advanced";
type AppRegionStyle = CSSProperties & {
  WebkitAppRegion?: "drag" | "no-drag";
};

const WORKSPACE_GROUPS: Array<{
  title: string;
  items: Array<{
    pane: WorkspacePane;
    label: string;
    description: string;
    href: string;
    icon: typeof Activity;
  }>;
}> = [
  {
    title: "Workspace",
    items: [
      {
        pane: "overview",
        label: "Mission Control",
        description: "Operator home, posture, and high-level recovery.",
        href: "/dashboard",
        icon: Activity,
      },
    ],
  },
  {
    title: "Fleet",
    items: [
      {
        pane: "fleet",
        label: "Assistants",
        description: "Assistant registry and ownership.",
        href: "/dashboard/agents",
        icon: Bot,
      },
      {
        pane: "rollouts",
        label: "Rollouts",
        description: "Deployment and replica posture.",
        href: "/dashboard/deployments",
        icon: Layers,
      },
      {
        pane: "operations",
        label: "Operations",
        description: "Run queue, execution state, and debugging pivots.",
        href: "/dashboard/runs",
        icon: Workflow,
      },
      {
        pane: "monitoring",
        label: "Monitoring",
        description: "Alerts, health, and runtime posture.",
        href: "/dashboard/monitoring",
        icon: Radar,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        pane: "api-keys",
        label: "Keys",
        description: "Issuance and rotation.",
        href: "/dashboard/api-keys",
        icon: ShieldCheck,
      },
      {
        pane: "budgets",
        label: "Spend",
        description: "Credits and budget posture.",
        href: "/dashboard/budgets",
        icon: Wallet,
      },
      {
        pane: "analytics",
        label: "Analytics",
        description: "Volume, latency, and usage trends.",
        href: "/dashboard/analytics",
        icon: Brain,
      },
      {
        pane: "webhooks",
        label: "Webhooks",
        description: "Outbound delivery endpoints.",
        href: "/dashboard/webhooks",
        icon: Webhook,
      },
      {
        pane: "security",
        label: "Security",
        description: "Identity, trust, and token posture.",
        href: "/dashboard/security",
        icon: ShieldCheck,
      },
      {
        pane: "automation",
        label: "Automation",
        description: "Workflow and orchestration posture.",
        href: "/dashboard/orchestration",
        icon: LayoutPanelLeft,
      },
      {
        pane: "memory",
        label: "Memory",
        description: "Retention and context posture.",
        href: "/dashboard/memory",
        icon: Brain,
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        pane: "swarm",
        label: "Swarm",
        description: "Topology and grouped runtime views.",
        href: "/dashboard/swarm",
        icon: Layers,
      },
      {
        pane: "channels",
        label: "Channels",
        description: "Channel and gateway affordances.",
        href: "/dashboard/channels",
        icon: MessagesSquare,
      },
      {
        pane: "history",
        label: "History",
        description: "Operator audit and event history.",
        href: "/dashboard/history",
        icon: History,
      },
      {
        pane: "skills",
        label: "Skills",
        description: "Installed operator skills.",
        href: "/dashboard/skills",
        icon: Brain,
      },
      {
        pane: "spawn",
        label: "Spawn Lab",
        description: "Create new operator assets.",
        href: "/dashboard/spawn",
        icon: Bot,
      },
      {
        pane: "logs",
        label: "Failure Logs",
        description: "Machine-local failure surface.",
        href: "/dashboard/logs",
        icon: Radar,
      },
    ],
  },
];

const SETTINGS_PANES: Array<{
  pane: SettingsPane;
  label: string;
  description: string;
  icon: typeof Activity;
}> = [
  { pane: "account", label: "Account", description: "Operator identity and workspace binding.", icon: ShieldCheck },
  { pane: "runtime", label: "Runtime", description: "Local stack, workspace, and execution surfaces.", icon: LayoutPanelLeft },
  { pane: "gateway", label: "Gateway", description: "OpenClaw and gateway posture.", icon: Radar },
  { pane: "governance", label: "Governance", description: "Faramesh status and approvals.", icon: Brain },
  { pane: "advanced", label: "Advanced", description: "Bridge, diagnostics, and desktop internals.", icon: Settings2 },
];

const NON_PRIMARY_WORKSPACE_PANES = new Set<WorkspacePane>([
  "automation",
  "memory",
  "channels",
  "history",
  "skills",
  "spawn",
  "logs",
]);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

function WindowSwitcher({
  activeRole,
  onSelect,
  style,
}: {
  activeRole: "workspace" | "sessions" | "traces" | "settings";
  onSelect: (role: "workspace" | "sessions" | "traces" | "settings") => void;
  style?: AppRegionStyle;
}) {
  const items = [
    { role: "workspace", label: "Workspace" },
    { role: "sessions", label: "Sessions" },
    { role: "traces", label: "Traces" },
    { role: "settings", label: "Settings" },
  ] as const;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-[14px] border border-[#d4d8df] bg-[linear-gradient(180deg,#f7f8fb_0%,#eef1f5_100%)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]"
      style={style}
    >
      {items.map((item) => (
        <button
          key={item.role}
          type="button"
          onClick={() => onSelect(item.role)}
          className={cn(
            "rounded-[11px] px-4 py-2 text-[12.5px] font-medium tracking-[-0.01em] transition",
            item.role === activeRole
              ? "bg-white text-[#171a1f] shadow-[0_1px_2px_rgba(16,24,40,0.08),0_6px_16px_rgba(16,24,40,0.06)]"
              : "text-[#5e6672] hover:bg-white/80 hover:text-[#171a1f]",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function CommandPalette({
  open,
  query,
  onQueryChange,
  onClose,
  actions,
}: {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  actions: Array<{ id: string; label: string; detail: string; onSelect: () => void }>;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-[#0f1115]/45 px-4 py-20 backdrop-blur-[6px]">
      <div className="w-full max-w-[760px] overflow-hidden rounded-[22px] border border-[#d7dce3] bg-[#f7f8fb] shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-center gap-3 border-b border-[#dde1e8] px-5 py-4">
          <Search className="h-4 w-4 text-[#7f8894]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search windows, panes, and desktop actions"
            className="w-full bg-transparent text-[15px] text-[#171a1f] outline-none placeholder:text-[#8f97a3]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#d8dde5] bg-white px-2.5 py-1.5 text-[12px] text-[#5c6672]"
          >
            Esc
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-3">
          {actions.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#d8dde5] px-4 py-10 text-center text-sm text-[#7c8694]">
              No matching desktop actions.
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.onSelect();
                    onClose();
                  }}
                  className="w-full rounded-[14px] border border-[#dde1e8] bg-white px-4 py-3 text-left transition hover:border-[#c9d0db] hover:bg-[#fcfcfe]"
                >
                  <p className="text-sm font-medium text-[#15181d]">{action.label}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#7f8894]">{action.detail}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DesktopWindowShell({ children }: { children: ReactNode }) {
  const { status } = useDesktopStatus();
  const { currentWindow, openWindow, updateCurrentWindow, openPreferences } = useDesktopWindow();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
  const dragRegionStyle: AppRegionStyle = {
    WebkitAppRegion: "drag",
    paddingLeft: isMac ? 82 : 18,
  };
  const noDragRegionStyle: AppRegionStyle = { WebkitAppRegion: "no-drag" };

  const role = currentWindow.currentRole;
  const currentRoute = currentWindow.currentWindow.route;
  const workspacePane = (currentWindow.currentWindow.payload.pane || "overview") as WorkspacePane;
  const settingsPane = (currentWindow.currentWindow.payload.pane || "account") as SettingsPane;
  const tracesTab = currentWindow.currentWindow.payload.tab || "timeline";

  const workspaceItems = useMemo(() => WORKSPACE_GROUPS, []);
  const primaryWorkspaceGroups = useMemo(
    () =>
      WORKSPACE_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !NON_PRIMARY_WORKSPACE_PANES.has(item.pane)),
      })).filter((group) => group.items.length > 0),
    [],
  );
  const primaryWorkspaceItems = useMemo(
    () => primaryWorkspaceGroups.flatMap((group) => group.items),
    [primaryWorkspaceGroups],
  );
  const visibleWorkspaceItem =
    workspaceItems
      .flatMap((group) => group.items)
      .find(
        (item) => item.href === currentRoute || item.pane === workspacePane,
      ) || workspaceItems[0].items[0];
  const currentWorkspaceIndex = Math.max(
    0,
    primaryWorkspaceItems.findIndex((item) => item.pane === visibleWorkspaceItem.pane),
  );
  const currentSettingsIndex = Math.max(
    0,
    SETTINGS_PANES.findIndex((item) => item.pane === settingsPane),
  );

  const shellTitle =
    role === "workspace"
      ? visibleWorkspaceItem.label
      : role === "sessions"
        ? "Sessions"
        : role === "traces"
          ? tracesTab === "logs"
            ? "Trace Logs"
            : "Trace Explorer"
          : "Settings";

  const shellSubtitle =
    role === "workspace"
      ? visibleWorkspaceItem.description
      : role === "sessions"
        ? "Dedicated conversation and session workspace."
        : role === "traces"
          ? "Dedicated debugging workspace for runs, traces, and logs."
        : "Preferences and local desktop controls.";

  const lifecycleChips = useMemo(
    () => [
      {
        label: `UI ${status.uiServer?.state || "unknown"}`,
        tone:
          status.uiServer?.state === "ready"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status.uiServer?.state === "starting" || status.uiServer?.state === "restarting"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
      },
      {
        label: `Bridge ${status.bridge?.state || "unknown"}`,
        tone:
          status.bridge?.state === "ready"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status.bridge?.state === "idle"
              ? "border-slate-200 bg-slate-50 text-slate-600"
            : status.bridge?.state === "starting" || status.bridge?.state === "restarting"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
      },
      {
        label: `Runtime ${status.runtime?.state || "unknown"}`,
        tone:
          status.runtime?.state === "ready"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status.runtime?.state === "degraded" ||
                status.runtime?.state === "starting" ||
                status.runtime?.state === "restarting"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
      },
    ],
    [status],
  );

  const shellDiagnostic = useMemo(() => {
    if (status.uiServer?.state && status.uiServer.state !== "ready") {
      return {
        title: "Desktop UI bootstrap is degraded",
        message:
          status.uiServer.lastError ||
          "The packaged dashboard surface is still starting or needs operator recovery.",
        tone: "danger",
      };
    }

    if (status.bridge?.state && status.bridge.state !== "ready" && status.bridge.state !== "idle") {
      return {
        title: "Desktop bridge is not fully ready",
        message:
          status.bridge.lastError ||
          "Desktop-native actions stay gated until the Python bridge completes its readiness probe.",
        tone: "warning",
      };
    }

    if (status.runtime?.state && status.runtime.state !== "ready") {
      return {
        title: "Runtime posture is degraded",
        message:
          status.runtime.lastError ||
          "The machine window state is restored, but the live runtime contract is not yet healthy.",
        tone: "warning",
      };
    }

    return null;
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }

      if ((event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
        setPaletteQuery("");
        return;
      }

      if (paletteOpen) {
        return;
      }

      if (role === "workspace" && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          (currentWorkspaceIndex + delta + primaryWorkspaceItems.length) % primaryWorkspaceItems.length;
        void selectWorkspacePane(primaryWorkspaceItems[nextIndex]);
        return;
      }

      if (role === "settings" && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (currentSettingsIndex + delta + SETTINGS_PANES.length) % SETTINGS_PANES.length;
        void selectSettingsPane(SETTINGS_PANES[nextIndex].pane);
        return;
      }

      if (role === "traces" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        void selectTracesTab(tracesTab === "timeline" ? "logs" : "timeline");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentSettingsIndex,
    currentWorkspaceIndex,
    paletteOpen,
    primaryWorkspaceItems,
    role,
    tracesTab,
  ]);

  const paletteActions = useMemo(() => {
    const baseActions = [
      {
        id: "open-workspace",
        label: "Open Workspace Window",
        detail: "Focus the main control window.",
        onSelect: () => void openWindow("workspace", { pane: workspacePane }),
      },
      {
        id: "open-sessions",
        label: "Open Sessions Window",
        detail: "Focus or create the dedicated sessions window.",
        onSelect: () => void openWindow("sessions"),
      },
      {
        id: "open-traces",
        label: "Open Traces Window",
        detail: "Focus or create the dedicated traces window.",
        onSelect: () => void openWindow("traces", { tab: "timeline" }),
      },
      {
        id: "open-settings",
        label: "Open Settings",
        detail: "Open the preferences window.",
        onSelect: () => void openPreferences("account"),
      },
      {
        id: "open-tui",
        label: "Open TUI",
        detail: "Launch the terminal-native runtime surface.",
        onSelect: () => {
          void window.mutxDesktop?.bridge.runtime.openSurface("tui");
        },
      },
    ];

    const workspaceActions = primaryWorkspaceGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: `workspace-${item.pane}`,
        label: `Go to ${item.label}`,
        detail: item.description,
        onSelect: () => void updateCurrentWindow({ route: item.href, payload: { pane: item.pane } }),
      })),
    );

    const settingsActions = SETTINGS_PANES.map((pane) => ({
      id: `settings-${pane.pane}`,
      label: `Open ${pane.label} Preferences`,
      detail: pane.description,
      onSelect: () => {
        void openPreferences(pane.pane);
      },
    }));
    return [...baseActions, ...workspaceActions, ...settingsActions].filter((action) => {
      const haystack = `${action.label} ${action.detail}`.toLowerCase();
      return haystack.includes(paletteQuery.trim().toLowerCase());
    });
  }, [openPreferences, openWindow, paletteQuery, primaryWorkspaceGroups, updateCurrentWindow, workspacePane]);

  async function handleOpenWindow(
    nextRole: "workspace" | "sessions" | "traces" | "settings",
    payload: DesktopWindowPayload = {},
  ) {
    if (nextRole === "workspace") {
      await openWindow("workspace", { pane: workspacePane, ...payload });
      return;
    }

    if (nextRole === "settings") {
      await openPreferences((payload.pane as string) || "account");
      return;
    }

    await openWindow(nextRole, payload);
  }

  async function selectWorkspacePane(item: (typeof WORKSPACE_GROUPS)[number]["items"][number]) {
    await updateCurrentWindow({
      route: item.href,
      payload: {
        ...currentWindow.currentWindow.payload,
        pane: item.pane,
      },
    });
  }

  async function selectSettingsPane(pane: SettingsPane) {
    await updateCurrentWindow({
      route: "/dashboard/control",
      payload: {
        ...currentWindow.currentWindow.payload,
        pane,
      },
    });
  }

  async function selectTracesTab(tab: string) {
    const nextRoute = tab === "logs" ? "/dashboard/logs" : "/dashboard/traces";
    await updateCurrentWindow({
      route: nextRoute,
      payload: {
        ...currentWindow.currentWindow.payload,
        tab,
      },
    });
  }

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#e9edf2_0%,#e4e8ef_100%)] text-[#15181d]"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <CommandPalette
        open={paletteOpen}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
        onClose={() => {
          setPaletteOpen(false);
          setPaletteQuery("");
        }}
        actions={paletteActions}
      />

      <div className="min-h-screen w-full">
        <div className="min-h-screen overflow-hidden bg-[#f5f7fb]">
          <div
            className="grid h-[54px] grid-cols-[minmax(84px,1fr)_auto_minmax(260px,1fr)] items-center gap-3 border-b border-[#dce1e8] bg-[linear-gradient(180deg,#fbfcfe_0%,#f2f5f9_100%)] px-4"
            style={dragRegionStyle}
          >
            <div />
            <div className="justify-self-center">
              <WindowSwitcher
                activeRole={role}
                onSelect={(nextRole) => {
                  void handleOpenWindow(nextRole);
                }}
                style={noDragRegionStyle}
              />
            </div>

            <div className="flex items-center justify-self-end gap-2" style={noDragRegionStyle}>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="inline-flex min-w-[170px] items-center justify-between gap-3 rounded-[12px] border border-[#d8dde5] bg-white/90 px-3.5 py-2 text-[12px] text-[#5d6672] shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur transition hover:bg-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search panes and actions
                </span>
                <span className="rounded-[8px] border border-[#d8dde5] bg-[#f7f8fb] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#7e8792]">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void window.mutxDesktop?.bridge.runtime.openSurface("tui")}
                disabled={!status.bridge?.ready}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#d8dde5] bg-white/90 px-3.5 py-2 text-[12px] text-[#5d6672] shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur disabled:opacity-50"
              >
                <TerminalSquare className="h-4 w-4" />
                TUI
              </button>
              <button
                type="button"
                onClick={() => void openPreferences("account")}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#d8dde5] bg-white/90 px-3.5 py-2 text-[12px] text-[#5d6672] shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur"
              >
                <Settings2 className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>

          <div className="border-b border-[#dde2e9] bg-[#fbfcfe] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d8dde5] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f7782]">
                    {role === "workspace"
                      ? "workspace"
                      : role === "sessions"
                        ? "sessions"
                        : role === "traces"
                          ? "traces"
                          : "settings"}
                  </span>
                  <p className="text-[1.02rem] font-semibold tracking-[-0.03em] text-[#171a1f]">
                    {shellTitle}
                  </p>
                </div>
                <p className="mt-1 text-[12.5px] leading-5 text-[#7c8593]">{shellSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#d8dde5] bg-white px-3 py-1.5 text-[11px] text-[#617080]">
                  {status.user?.email || "desktop session"}
                </span>
                <span className="rounded-full border border-[#d8dde5] bg-white px-3 py-1.5 text-[11px] text-[#617080]">
                  {status.mode === "local" ? "local runtime" : status.mode || "runtime unknown"}
                </span>
                {lifecycleChips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`rounded-full border px-3 py-1.5 text-[11px] ${chip.tone}`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {shellDiagnostic ? (
            <div
              className={cn(
                "border-b px-5 py-3 text-sm",
                shellDiagnostic.tone === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              )}
            >
              <p className="font-medium">{shellDiagnostic.title}</p>
              <p className="mt-1 text-xs opacity-90">{shellDiagnostic.message}</p>
            </div>
          ) : null}

          <div className="flex min-h-[calc(100vh-7.25rem)] bg-[linear-gradient(180deg,#f5f7fb_0%,#edf1f6_100%)]">
            {role === "workspace" ? (
              <aside className="w-[clamp(220px,13vw,280px)] shrink-0 border-r border-[#dde2e9] bg-[linear-gradient(180deg,#f9fbfe_0%,#f4f6fa_100%)] px-3 py-4">
                <div className="flex h-full flex-col gap-4">
                  <div className="space-y-4">
                    {primaryWorkspaceGroups.map((group) => (
                      <div key={group.title} className="space-y-1.5">
                        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8992a0]">
                          {group.title}
                        </p>
                        {group.items.map((item) => {
                          const active = item.pane === workspacePane || item.href === currentRoute;
                          return (
                            <button
                              key={item.pane}
                              type="button"
                              onClick={() => void selectWorkspacePane(item)}
                              className={cn(
                                "w-full rounded-[14px] border px-3 py-3 text-left transition",
                                active
                                  ? "border-[#cfd6e1] bg-white text-[#15181d] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                                  : "border-transparent text-[#65707e] hover:border-[#e0e5ec] hover:bg-white/80 hover:text-[#15181d]",
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
                                    active ? "bg-[#eef3fa] text-[#243447]" : "bg-[#eef1f5] text-[#758192]",
                                  )}
                                >
                                  <item.icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium">{item.label}</p>
                                  <p className="mt-1 hidden text-[11.5px] leading-4 text-[#7d8795] 2xl:block">{item.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto rounded-[16px] border border-[#d7dde6] bg-white/82 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#88929f]">
                      Keyboard
                    </p>
                    <div className="mt-2 space-y-2 text-[11.5px] text-[#5f6975]">
                      <div className="flex items-center justify-between gap-3">
                        <span>Command palette</span>
                        <span className="rounded-[8px] border border-[#dbe1e8] bg-[#f6f8fb] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#7f8894]">
                          {isMac ? "⌘K" : "Ctrl+K"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Move through panes</span>
                        <span className="rounded-[8px] border border-[#dbe1e8] bg-[#f6f8fb] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#7f8894]">
                          ↑↓
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            ) : role === "settings" ? (
              <aside className="w-[clamp(220px,13vw,272px)] shrink-0 border-r border-[#dde2e9] bg-[linear-gradient(180deg,#f9fbfe_0%,#f4f6fa_100%)] px-3 py-4">
                <div className="space-y-1.5">
                  {SETTINGS_PANES.map((item) => {
                    const active = item.pane === settingsPane;
                    return (
                      <button
                        key={item.pane}
                        type="button"
                        onClick={() => void selectSettingsPane(item.pane)}
                        className={cn(
                          "w-full rounded-[14px] border px-3 py-3 text-left transition",
                          active
                            ? "border-[#cfd6e1] bg-white text-[#15181d] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                            : "border-transparent text-[#65707e] hover:border-[#e0e5ec] hover:bg-white/80 hover:text-[#15181d]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
                              active ? "bg-[#eef3fa] text-[#243447]" : "bg-[#eef1f5] text-[#758192]",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium">{item.label}</p>
                            <p className="mt-1 hidden text-[11.5px] leading-4 text-[#7d8795] 2xl:block">{item.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
              {(role === "sessions" || role === "traces") && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dde2e9] bg-[#f7f9fc] px-5 py-3">
                  <div className="flex items-center gap-2">
                    {role === "traces" ? (
                      <div className="inline-flex items-center gap-1 rounded-[12px] border border-[#d6dbe3] bg-white p-1">
                        {[
                          { label: "Timeline", tab: "timeline" },
                          { label: "Logs", tab: "logs" },
                        ].map((item) => (
                          <button
                            key={item.tab}
                            type="button"
                            onClick={() => void selectTracesTab(item.tab)}
                            className={cn(
                              "rounded-[9px] px-3 py-1.5 text-[12px] transition",
                              tracesTab === item.tab
                                ? "bg-[#f1f4f8] text-[#15181d]"
                                : "text-[#6d7683] hover:bg-[#f7f8fb]",
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[12px] border border-[#d8dde5] bg-white px-3 py-1.5 text-[12px] text-[#5d6672]">
                        Dedicated conversation workspace
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void window.mutxDesktop?.bridge.system.revealInFinder(
                          status.assistant?.workspace || "",
                        )
                      }
                      disabled={!status.assistant?.workspace}
                      className="inline-flex items-center gap-2 rounded-[11px] border border-[#d8dde5] bg-white px-3 py-1.5 text-[12px] text-[#5d6672] disabled:opacity-50"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => void openWindow("workspace", { pane: "overview" })}
                      className="inline-flex items-center gap-2 rounded-[11px] border border-[#d8dde5] bg-white px-3 py-1.5 text-[12px] text-[#5d6672]"
                    >
                      <LayoutPanelLeft className="h-4 w-4" />
                      Workspace
                    </button>
                  </div>
                </div>
              )}

              <main className="min-w-0 flex-1 overflow-y-auto p-4 xl:p-4 2xl:p-5">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
