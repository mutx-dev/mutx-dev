"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  LogOut,
  Power,
  RefreshCw,
  Shield,
  TerminalSquare,
  Wrench,
} from "lucide-react";

import { LiveEmptyState, LivePanel, formatDateTime } from "@/components/dashboard/livePrimitives";
import { DesktopJobNotice } from "@/components/desktop/DesktopJobNotice";
import type {
  GovernanceStatus,
  RuntimeInfo,
} from "@/components/desktop/types";
import { useDesktopJob } from "@/components/desktop/useDesktopJob";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";

function PreferencesButton({
  label,
  onClick,
  icon: Icon,
  disabled = false,
  busy = false,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  icon: typeof RefreshCw;
  disabled?: boolean;
  busy?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex items-center gap-2 rounded-[11px] border px-3 py-1.5 text-[12px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-[#d8dde5] bg-white text-[#5d6672] hover:bg-[#f8f9fb]"
      }`}
    >
      <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

export function DesktopSettingsWindow() {
  const { status, refetch } = useDesktopStatus();
  const { currentWindow } = useDesktopWindow();
  const {
    job,
    resetJob,
    runDoctorJob,
    runControlPlaneStartJob,
    runControlPlaneStopJob,
    runRuntimeResyncJob,
    runGovernanceRestartJob,
  } = useDesktopJob();
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [governance, setGovernance] = useState<GovernanceStatus | null>(null);
  const [userDataPath, setUserDataPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pane = currentWindow.currentWindow.payload.pane || "account";

  const loadPreferencesSnapshot = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      return;
    }

    try {
      const [nextRuntimeInfo, nextGovernance, nextUserDataPath] = await Promise.all([
        window.mutxDesktop!.bridge.runtime.inspect(),
        window.mutxDesktop!.bridge.governance.status(),
        window.mutxDesktop!.getUserDataPath(),
      ]);
      setRuntimeInfo(nextRuntimeInfo);
      setGovernance(nextGovernance);
      setUserDataPath(nextUserDataPath);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load preferences state");
    }
  }, []);

  useEffect(() => {
    void loadPreferencesSnapshot();
  }, [loadPreferencesSnapshot, pane]);

  useEffect(() => {
    if (job.status === "completed") {
      void loadPreferencesSnapshot();
    }
  }, [job.status, loadPreferencesSnapshot]);

  const sharedActions = (
    <div className="flex flex-wrap gap-2">
      <PreferencesButton
        label="Run Doctor"
        icon={Wrench}
        busy={job.id === "doctor" && job.status === "running"}
        onClick={() => void runDoctorJob()}
      />
      <PreferencesButton
        label="Open TUI"
        icon={TerminalSquare}
        disabled={!status.bridge?.ready}
        onClick={() => void window.mutxDesktop?.bridge.runtime.openSurface("tui")}
      />
      <PreferencesButton
        label="Reveal Workspace"
        icon={FolderOpen}
        disabled={!status.assistant?.workspace}
        onClick={() =>
          void window.mutxDesktop?.bridge.system.revealInFinder(status.assistant?.workspace || "")
        }
      />
    </div>
  );

  if (error) {
    return <LiveEmptyState title="Preferences unavailable" message={error} />;
  }

  return (
    <div className="space-y-4">
      <DesktopJobNotice job={job} onDismiss={resetJob} tone="light" />

      {pane === "account" ? (
        <>
          <LivePanel title="Operator Account" meta="identity + binding" action={sharedActions}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">
                  Signed-in operator
                </p>
                <p className="mt-2 text-lg font-semibold text-[#15181d]">
                  {status.user?.name || "No operator session"}
                </p>
                <p className="mt-1 text-sm text-[#6e7784]">{status.user?.email || "Sign in required"}</p>
                <p className="mt-4 text-sm text-[#6e7784]">Plan: {status.user?.plan || "n/a"}</p>
              </div>
              <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">
                  Workspace binding
                </p>
                <p className="mt-2 text-sm text-[#15181d]">
                  {status.assistant?.workspace || "No workspace bound to the desktop operator yet."}
                </p>
                <p className="mt-4 text-sm text-[#6e7784]">
                  Assistant: {status.assistant?.name || "Not configured"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PreferencesButton
                label="Log Out"
                icon={LogOut}
                tone="danger"
                onClick={() =>
                  void (async () => {
                    await window.mutxDesktop?.bridge.auth.logout();
                    await refetch();
                  })()
                }
              />
            </div>
          </LivePanel>
        </>
      ) : null}

      {pane === "runtime" ? (
        <>
          <LivePanel title="Runtime Control" meta="local machine runtime" action={sharedActions}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">
                  Control plane
                </p>
                <p className="mt-2 text-lg font-semibold text-[#15181d]">
                  {status.localControlPlane?.state === "ready"
                    ? "Online"
                    : status.localControlPlane?.state || "Unknown"}
                </p>
                <p className="mt-1 text-sm text-[#6e7784]">
                  {status.localControlPlane?.path || "No local control plane path available."}
                </p>
                {status.localControlPlane?.lastError ? (
                  <p className="mt-3 text-sm text-amber-700">{status.localControlPlane.lastError}</p>
                ) : null}
              </div>
              <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">
                  Runtime target
                </p>
                <p className="mt-2 text-lg font-semibold text-[#15181d]">{status.mode || "unknown"}</p>
                <p className="mt-1 text-sm text-[#6e7784]">{status.apiUrl || "No API target configured."}</p>
                {status.runtime?.lastError ? (
                  <p className="mt-3 text-sm text-amber-700">{status.runtime.lastError}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PreferencesButton
                label={status.localControlPlane?.ready ? "Stop Local Stack" : "Start Local Stack"}
                icon={Power}
                busy={
                  (job.id === "controlPlaneStart" || job.id === "controlPlaneStop") &&
                  job.status === "running"
                }
                onClick={() =>
                  void (status.localControlPlane?.ready ? runControlPlaneStopJob() : runControlPlaneStartJob())
                }
              />
              <PreferencesButton
                label="Resync Runtime"
                icon={RefreshCw}
                busy={job.id === "runtimeResync" && job.status === "running"}
                onClick={() => void runRuntimeResyncJob()}
              />
            </div>
          </LivePanel>
        </>
      ) : null}

      {pane === "gateway" ? (
        <LivePanel title="Gateway" meta="openclaw posture" action={sharedActions}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Gateway health</p>
              <p className="mt-2 text-lg font-semibold text-[#15181d]">{status.openclaw?.health || "unknown"}</p>
              <p className="mt-1 text-sm text-[#6e7784]">{status.openclaw?.gatewayUrl || "Gateway URL unavailable."}</p>
            </div>
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Gateway config</p>
              <p className="mt-2 text-sm text-[#15181d]">
                {typeof runtimeInfo?.openclaw?.config_path === "string"
                  ? runtimeInfo.openclaw.config_path
                  : "No config path reported."}
              </p>
              <p className="mt-3 text-sm text-[#6e7784]">
                {typeof runtimeInfo?.openclaw?.gateway === "object" &&
                runtimeInfo?.openclaw?.gateway &&
                "doctor_summary" in runtimeInfo.openclaw.gateway &&
                typeof runtimeInfo.openclaw.gateway.doctor_summary === "string"
                  ? runtimeInfo.openclaw.gateway.doctor_summary
                  : "No doctor summary reported."}
              </p>
            </div>
          </div>
        </LivePanel>
      ) : null}

      {pane === "governance" ? (
        <LivePanel title="Governance" meta="faramesh" action={sharedActions}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Daemon status</p>
              <p className="mt-2 text-lg font-semibold text-[#15181d]">
                {status.faramesh?.available ? status.faramesh.health || "active" : "idle"}
              </p>
              <p className="mt-1 text-sm text-[#6e7784]">
                {status.faramesh?.socketPath || "No local governance socket available."}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Approval backlog</p>
              <p className="mt-2 text-lg font-semibold text-[#15181d]">{governance?.pending_approvals ?? 0}</p>
              <p className="mt-1 text-sm text-[#6e7784]">
                Last decision {formatDateTime(governance?.last_decision_at || null)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PreferencesButton
              label="Restart Governance"
              icon={Shield}
              busy={job.id === "governanceRestart" && job.status === "running"}
              onClick={() => void runGovernanceRestartJob()}
            />
          </div>
        </LivePanel>
      ) : null}

      {pane === "advanced" ? (
        <LivePanel title="Advanced Desktop State" meta="bridge + internals" action={sharedActions}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Bridge</p>
              <p className="mt-2 text-sm text-[#15181d]">{status.bridge.pythonCommand || "unknown"}</p>
              <p className="mt-1 text-sm text-[#6e7784]">{status.bridge.scriptPath || "No bridge script path"}</p>
              <p className="mt-3 text-sm text-[#6e7784]">
                State {status.bridge.state || "unknown"}
                {status.bridge.lastError ? ` · ${status.bridge.lastError}` : ""}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">Desktop UI server</p>
              <p className="mt-2 text-sm text-[#15181d]">{status.uiServer?.url || "No local UI server URL"}</p>
              <p className="mt-1 text-sm text-[#6e7784]">
                State {status.uiServer?.state || "unknown"}
                {status.uiServer?.lastError ? ` · ${status.uiServer.lastError}` : ""}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#dde2e9] bg-white px-4 py-4 md:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8690a0]">User data path</p>
              <p className="mt-2 text-sm text-[#15181d]">{userDataPath || "Unknown"}</p>
              <p className="mt-1 text-sm text-[#6e7784]">
                MUTX version {status.mutxVersion || "unknown"} · runtime state {status.runtime?.state || "unknown"}
              </p>
            </div>
          </div>
        </LivePanel>
      ) : null}
    </div>
  );
}
