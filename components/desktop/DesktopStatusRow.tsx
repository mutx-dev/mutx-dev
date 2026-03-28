"use client";

import { Bot, Server, Shield, Users, HardDrive, Globe } from "lucide-react";

import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" || status === "healthy" || status === "ready"
      ? "bg-emerald-400"
      : status === "degraded" || status === "warning"
        ? "bg-amber-400"
        : "bg-slate-500";

  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function DesktopCard({
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const borderColors = {
    default: "border-white/10",
    good: "border-emerald-500/30",
    warn: "border-amber-500/30",
    bad: "border-rose-500/30",
  };

  const iconColors = {
    default: "text-cyan-400",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-rose-400",
  };

  return (
    <div
      className={`rounded-xl border bg-black/20 p-4 ${borderColors[tone]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColors[tone]}`} />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatusValue({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {subvalue && <p className="text-xs text-slate-600">{subvalue}</p>}
    </div>
  );
}

export function DesktopStatusRow() {
  const { status, loading, error, isDesktop } = useDesktopStatus();

  if (!isDesktop) {
    return null;
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-white/10 bg-black/20"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
        <p className="text-sm text-rose-300">Failed to load desktop status: {error}</p>
      </div>
    );
  }

  const modeTone =
    status.mode === "local" ? "good" : status.mode === "hosted" ? "default" : "warn";
  const gatewayTone =
    status.openclaw?.health === "healthy" || status.openclaw?.health === "running"
      ? "good"
      : status.openclaw?.health === "unknown"
        ? "default"
        : "warn";
  const farameshTone = status.faramesh?.available ? "good" : "warn";
  const assistantTone = status.assistant?.found ? "good" : "default";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-400">Desktop Status</h2>
        {status.mutxVersion && (
          <span className="text-xs text-slate-600">v{status.mutxVersion}</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DesktopCard icon={Globe} title="Mode" tone={modeTone}>
          <div className="flex items-center gap-2">
            <StatusDot status={status.mode} />
            <span className="text-sm font-medium text-white capitalize">
              {status.mode}
            </span>
          </div>
          {status.apiUrl && (
            <p className="mt-1 truncate font-mono text-xs text-slate-500">
              {status.apiUrl.replace("http://", "").replace("https://", "")}
            </p>
          )}
        </DesktopCard>

        <DesktopCard icon={Server} title="Gateway" tone={gatewayTone}>
          <div className="flex items-center gap-2">
            <StatusDot status={status.openclaw?.health || "unknown"} />
            <span className="text-sm font-medium text-white">
              {status.openclaw?.health || "unknown"}
            </span>
          </div>
          {status.openclaw?.gatewayUrl && (
            <p className="mt-1 truncate font-mono text-xs text-slate-500">
              {status.openclaw.gatewayUrl}
            </p>
          )}
        </DesktopCard>

        <DesktopCard icon={Shield} title="Governance" tone={farameshTone}>
          <div className="flex items-center gap-2">
            <StatusDot status={status.faramesh?.available ? "running" : "stopped"} />
            <span className="text-sm font-medium text-white">
              {status.faramesh?.available ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {status.faramesh?.health || "Unknown"}
          </p>
        </DesktopCard>

        <DesktopCard icon={Bot} title="Assistant" tone={assistantTone}>
          {status.assistant?.found ? (
            <>
              <StatusValue
                label="Name"
                value={status.assistant.name || "Unknown"}
              />
              <div className="mt-2 flex items-center gap-2">
                <Users className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-500">
                  {status.assistant.sessionCount} sessions
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Not configured</p>
          )}
        </DesktopCard>
      </div>

      {status.localControlPlane?.path && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-500">
              Local Control Plane:{" "}
              <span className="font-mono">{status.localControlPlane.path}</span>
            </span>
            <StatusDot
              status={status.localControlPlane.ready ? "ready" : "stopped"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
