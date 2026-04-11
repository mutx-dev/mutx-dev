import { ALL_DASHBOARD_NAV_ITEMS } from "@/components/dashboard/dashboardNav";

export interface DashboardVisitRecord {
  href: string;
  pathname: string;
  title: string;
  description: string;
  context: string | null;
  visitedAt: string;
}

export interface DashboardReturnState {
  version: 1;
  visits: DashboardVisitRecord[];
  lastCheckedAt: string | null;
}

const STORAGE_KEY = "mutx-dashboard-return-loop";
const MAX_VISITS = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createDefaultState(): DashboardReturnState {
  return {
    version: 1,
    visits: [],
    lastCheckedAt: null,
  };
}

function shortenToken(value: string, length = 10) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length)}...`;
}

function resolveDashboardRoute(pathname: string) {
  return [...ALL_DASHBOARD_NAV_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

function deriveVisitContext(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  const priorityKeys: Array<[key: string, label: string]> = [
    ["agentId", "agent"],
    ["deploymentId", "deployment"],
    ["runId", "run"],
    ["sessionId", "session"],
    ["pane", "pane"],
    ["tab", "tab"],
  ];

  for (const [key, label] of priorityKeys) {
    const value = params.get(key);
    if (value) {
      return `${label} ${shortenToken(value)}`;
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 2) {
    return `detail ${shortenToken(segments[2] ?? "detail")}`;
  }

  return null;
}

function isVisitRecord(value: unknown): value is DashboardVisitRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.href === "string" &&
    typeof value.pathname === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.visitedAt === "string" &&
    (typeof value.context === "string" || value.context === null)
  );
}

function writeDashboardReturnState(state: DashboardReturnState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable
  }
}

export function readDashboardReturnState(): DashboardReturnState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return createDefaultState();
    }

    return {
      version: 1,
      visits: Array.isArray(parsed.visits) ? parsed.visits.filter(isVisitRecord).slice(0, MAX_VISITS) : [],
      lastCheckedAt: typeof parsed.lastCheckedAt === "string" ? parsed.lastCheckedAt : null,
    };
  } catch {
    return createDefaultState();
  }
}

export function trackDashboardVisit(pathname: string, search = "") {
  if (typeof window === "undefined" || !pathname.startsWith("/dashboard")) {
    return createDefaultState();
  }

  const route = resolveDashboardRoute(pathname);
  const href = `${pathname}${search}`;
  const visit: DashboardVisitRecord = {
    href,
    pathname,
    title: route?.title ?? "Overview",
    description: route?.description ?? "Dashboard route",
    context: deriveVisitContext(pathname, search),
    visitedAt: new Date().toISOString(),
  };

  const previous = readDashboardReturnState();
  const next: DashboardReturnState = {
    ...previous,
    visits: [visit, ...previous.visits.filter((entry) => entry.href !== href)].slice(0, MAX_VISITS),
  };

  writeDashboardReturnState(next);
  return next;
}

export function markDashboardChecked(at = new Date().toISOString()) {
  const previous = readDashboardReturnState();
  const next: DashboardReturnState = {
    ...previous,
    lastCheckedAt: at,
  };

  writeDashboardReturnState(next);
  return next;
}

export function getResumeVisit(
  visits: DashboardVisitRecord[],
  currentPathname = "/dashboard",
): DashboardVisitRecord | null {
  return (
    visits.find(
      (visit) => visit.pathname !== currentPathname && visit.pathname.startsWith("/dashboard") && visit.pathname !== "/dashboard",
    ) ??
    visits.find((visit) => visit.pathname !== currentPathname) ??
    null
  );
}

export function hasCheckedToday(lastCheckedAt: string | null, now = new Date()) {
  if (!lastCheckedAt) {
    return false;
  }

  const lastCheck = new Date(lastCheckedAt);
  if (Number.isNaN(lastCheck.getTime())) {
    return false;
  }

  return (
    lastCheck.getFullYear() === now.getFullYear() &&
    lastCheck.getMonth() === now.getMonth() &&
    lastCheck.getDate() === now.getDate()
  );
}
