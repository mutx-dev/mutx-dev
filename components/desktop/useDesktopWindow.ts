"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  DesktopCurrentWindowState,
  DesktopWindowPayload,
  DesktopWindowRole,
  DesktopWindowsState,
} from "@/components/desktop/types";

const DEFAULT_WINDOWS_STATE: DesktopWindowsState = {
  activeRole: "workspace",
  windows: {
    workspace: {
      role: "workspace",
      title: "Workspace",
      route: "/dashboard",
      payload: { pane: "overview" },
      visible: true,
      focused: true,
      maximized: false,
    },
    sessions: {
      role: "sessions",
      title: "Sessions",
      route: "/dashboard/sessions",
      payload: { tab: "live" },
      visible: false,
      focused: false,
      maximized: false,
    },
    traces: {
      role: "traces",
      title: "Traces",
      route: "/dashboard/traces",
      payload: { tab: "timeline" },
      visible: false,
      focused: false,
      maximized: false,
    },
    settings: {
      role: "settings",
      title: "Settings",
      route: "/dashboard/control",
      payload: { pane: "account" },
      visible: false,
      focused: false,
      maximized: false,
    },
  },
};

const DEFAULT_CURRENT_WINDOW: DesktopCurrentWindowState = {
  currentRole: "workspace",
  currentWindow: DEFAULT_WINDOWS_STATE.windows.workspace,
  state: DEFAULT_WINDOWS_STATE,
};

const WINDOW_QUERY_KEYS: Array<keyof DesktopWindowPayload> = [
  "pane",
  "tab",
  "agentId",
  "deploymentId",
  "runId",
  "sessionId",
];

function isDesktopRole(value: string | null): value is DesktopWindowRole {
  return value === "workspace" || value === "sessions" || value === "traces" || value === "settings";
}

function getDesktopRoleForPath(pathname: string): DesktopWindowRole {
  if (pathname === "/dashboard/sessions") {
    return "sessions";
  }

  if (pathname === "/dashboard/traces" || pathname === "/dashboard/logs") {
    return "traces";
  }

  if (pathname === "/dashboard/control") {
    return "settings";
  }

  return "workspace";
}

function getWorkspacePaneForPath(pathname: string) {
  switch (pathname) {
    case "/dashboard/agents":
      return "fleet";
    case "/dashboard/deployments":
      return "rollouts";
    case "/dashboard/runs":
      return "operations";
    case "/dashboard/monitoring":
      return "monitoring";
    case "/dashboard/api-keys":
      return "api-keys";
    case "/dashboard/budgets":
      return "budgets";
    case "/dashboard/analytics":
      return "analytics";
    case "/dashboard/webhooks":
      return "webhooks";
    case "/dashboard/security":
      return "security";
    case "/dashboard/orchestration":
      return "automation";
    case "/dashboard/memory":
      return "memory";
    case "/dashboard/swarm":
      return "swarm";
    case "/dashboard/channels":
      return "channels";
    case "/dashboard/history":
      return "history";
    case "/dashboard/skills":
      return "skills";
    case "/dashboard/spawn":
      return "spawn";
    case "/dashboard/logs":
      return "logs";
    default:
      return "overview";
  }
}

function getDerivedWindowStateFromLocation(): DesktopCurrentWindowState {
  if (typeof window === "undefined") {
    return DEFAULT_CURRENT_WINDOW;
  }

  const pathname = window.location.pathname || "/dashboard";
  const searchParams = new URLSearchParams(window.location.search);
  const hintedRole = searchParams.get("desktopWindowRole");
  const currentRole = isDesktopRole(hintedRole) ? hintedRole : getDesktopRoleForPath(pathname);
  const defaultWindow = DEFAULT_WINDOWS_STATE.windows[currentRole];
  const payload: DesktopWindowPayload = { ...defaultWindow.payload };

  for (const key of WINDOW_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value) {
      payload[key] = value;
    }
  }

  if (currentRole === "workspace" && !payload.pane) {
    payload.pane = getWorkspacePaneForPath(pathname);
  }

  if (currentRole === "traces" && !payload.tab) {
    payload.tab = pathname === "/dashboard/logs" ? "logs" : "timeline";
  }

  if (currentRole === "settings" && !payload.pane) {
    payload.pane = "account";
  }

  const windows = {
    workspace: {
      ...DEFAULT_WINDOWS_STATE.windows.workspace,
      visible: currentRole === "workspace",
      focused: currentRole === "workspace",
    },
    sessions: {
      ...DEFAULT_WINDOWS_STATE.windows.sessions,
      visible: currentRole === "sessions",
      focused: currentRole === "sessions",
    },
    traces: {
      ...DEFAULT_WINDOWS_STATE.windows.traces,
      visible: currentRole === "traces",
      focused: currentRole === "traces",
    },
    settings: {
      ...DEFAULT_WINDOWS_STATE.windows.settings,
      visible: currentRole === "settings",
      focused: currentRole === "settings",
    },
  };

  const currentWindow = {
    ...windows[currentRole],
    route: pathname,
    payload,
    visible: true,
    focused: true,
  };

  windows[currentRole] = currentWindow;

  return {
    currentRole,
    currentWindow,
    state: {
      activeRole: currentRole,
      windows,
    },
  };
}

interface DesktopWindowContextValue {
  windowsState: DesktopWindowsState;
  currentWindow: DesktopCurrentWindowState;
  ready: boolean;
  openWindow: (
    role: DesktopWindowRole,
    payload?: DesktopWindowPayload,
    route?: string,
  ) => Promise<DesktopWindowsState>;
  focusWindow: (role: DesktopWindowRole) => Promise<DesktopWindowsState>;
  closeWindow: (role: DesktopWindowRole) => Promise<DesktopWindowsState>;
  updateCurrentWindow: (
    updates: Partial<{
      route: string;
      payload: DesktopWindowPayload;
    }>,
  ) => Promise<DesktopCurrentWindowState>;
  openPreferences: (pane?: string) => Promise<DesktopWindowsState>;
}

const DesktopWindowContext = createContext<DesktopWindowContextValue | null>(null);

function useDesktopWindowState(active: boolean): DesktopWindowContextValue {
  const [windowsState, setWindowsState] = useState<DesktopWindowsState>(DEFAULT_WINDOWS_STATE);
  const [currentWindow, setCurrentWindow] = useState<DesktopCurrentWindowState>(DEFAULT_CURRENT_WINDOW);
  const [ready, setReady] = useState(!active);
  const immediateDesktop = typeof window !== "undefined" && Boolean(window.mutxDesktop?.isDesktop);
  const immediateCurrentWindow = immediateDesktop ? getDerivedWindowStateFromLocation() : DEFAULT_CURRENT_WINDOW;
  const resolvedReady = ready || immediateDesktop;
  const resolvedCurrentWindow = resolvedReady ? currentWindow : immediateCurrentWindow;
  const resolvedWindowsState = resolvedReady ? windowsState : immediateCurrentWindow.state;

  const syncState = useCallback(async () => {
    if (!active || typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      return;
    }

    const [globalState, current] = await Promise.all([
      window.mutxDesktop.windows.getState(),
      window.mutxDesktop.windows.getCurrent(),
    ]);

    setWindowsState(globalState);
    setCurrentWindow(current);
    setReady(true);
  }, [active]);

  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      setReady(true);
      return;
    }

    void syncState();

    const unsubscribe = window.mutxDesktop.onWindowStateChanged((state) => {
      setWindowsState(state);
      setCurrentWindow((previous) => ({
        currentRole: previous.currentRole,
        currentWindow: state.windows[previous.currentRole] || state.windows.workspace,
        state,
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, [active, syncState]);

  const openWindow = useCallback(
    async (role: DesktopWindowRole, payload?: DesktopWindowPayload, route?: string) => {
      const nextState = await window.mutxDesktop!.windows.open(role, payload, route);
      setWindowsState(nextState);
      return nextState;
    },
    [],
  );

  const focusWindow = useCallback(async (role: DesktopWindowRole) => {
    const nextState = await window.mutxDesktop!.windows.focus(role);
    setWindowsState(nextState);
    return nextState;
  }, []);

  const closeWindow = useCallback(async (role: DesktopWindowRole) => {
    const nextState = await window.mutxDesktop!.windows.close(role);
    setWindowsState(nextState);
    return nextState;
  }, []);

  const updateCurrentWindow = useCallback(
    async (updates: Partial<{ route: string; payload: DesktopWindowPayload }>) => {
      const nextCurrent = await window.mutxDesktop!.windows.setState(updates);
      setCurrentWindow(nextCurrent);
      setWindowsState(nextCurrent.state);
      return nextCurrent;
    },
    [],
  );

  const openPreferences = useCallback(async (pane?: string) => {
    const nextState = await window.mutxDesktop!.app.openPreferences(pane);
    setWindowsState(nextState);
    return nextState;
  }, []);

  return {
    windowsState: resolvedWindowsState,
    currentWindow: resolvedCurrentWindow,
    ready: resolvedReady,
    openWindow,
    focusWindow,
    closeWindow,
    updateCurrentWindow,
    openPreferences,
  };
}

export function DesktopWindowProvider({ children }: { children: ReactNode }) {
  const value = useDesktopWindowState(true);
  const memoizedValue = useMemo(
    () => value,
    [
      value.closeWindow,
      value.currentWindow,
      value.focusWindow,
      value.openPreferences,
      value.openWindow,
      value.ready,
      value.updateCurrentWindow,
      value.windowsState,
    ],
  );

  return createElement(DesktopWindowContext.Provider, { value: memoizedValue }, children);
}

export function useDesktopWindow() {
  const context = useContext(DesktopWindowContext);
  const fallback = useDesktopWindowState(!context);

  return context ?? fallback;
}
