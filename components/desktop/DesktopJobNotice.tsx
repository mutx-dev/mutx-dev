"use client";

import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

import type { Job } from "@/components/desktop/useDesktopJob";
import { cn } from "@/lib/utils";

const JOB_LABELS: Record<string, string> = {
  setup: "Setup Wizard",
  doctor: "Desktop Doctor",
  controlPlaneStart: "Start Local Stack",
  controlPlaneStop: "Stop Local Stack",
  runtimeResync: "Runtime Resync",
  governanceRestart: "Governance Restart",
};

function getJobLabel(jobId: string) {
  return JOB_LABELS[jobId] || jobId.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
}

export function DesktopJobNotice({
  job,
  onDismiss,
  tone = "dark",
}: {
  job: Job;
  onDismiss?: () => void;
  tone?: "dark" | "light";
}) {
  if (!job.id || job.status === "idle") {
    return null;
  }

  const running = job.status === "running" || job.status === "pending";
  const completed = job.status === "completed";
  const failed = job.status === "failed";
  const title = failed
    ? `${getJobLabel(job.id)} failed`
    : completed
      ? `${getJobLabel(job.id)} completed`
      : `${getJobLabel(job.id)} in progress`;
  const summary =
    job.error ||
    job.message ||
    (completed ? "Completed successfully." : "Working through the desktop action.");
  const percent = Math.max(8, Math.min(job.progress || (completed ? 100 : 24), 100));

  return (
    <div
      className={cn(
        "rounded-[16px] border px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
        tone === "light"
          ? failed
            ? "border-rose-200 bg-[linear-gradient(180deg,#fff7f8_0%,#fbecef_100%)]"
            : completed
              ? "border-emerald-200 bg-[linear-gradient(180deg,#f7fcf8_0%,#edf8f2_100%)]"
              : "border-[#d8dde5] bg-[linear-gradient(180deg,#ffffff_0%,#f4f6fa_100%)]"
          : failed
            ? "border-rose-500/20 bg-rose-500/10"
            : completed
              ? "border-emerald-500/20 bg-emerald-500/10"
              : "border-white/10 bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {running ? (
              <Loader2
                className={cn(
                  "h-4 w-4 animate-spin",
                  tone === "light" ? "text-[#526171]" : "text-cyan-200",
                )}
              />
            ) : completed ? (
              <CheckCircle2
                className={cn(
                  "h-4 w-4",
                  tone === "light" ? "text-emerald-700" : "text-emerald-200",
                )}
              />
            ) : (
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  tone === "light" ? "text-rose-700" : "text-rose-200",
                )}
              />
            )}
            <p
              className={cn(
                "text-[12.5px] font-semibold tracking-[-0.01em]",
                tone === "light" ? "text-[#171a1f]" : "text-white",
              )}
            >
              {title}
            </p>
          </div>
          <p
            className={cn(
              "mt-2 text-[12px] leading-5",
              tone === "light" ? "text-[#64707d]" : "text-slate-300",
            )}
          >
            {summary}
          </p>
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              "inline-flex items-center gap-1 rounded-[10px] border px-2 py-1 text-[11px] transition",
              tone === "light"
                ? "border-[#d7dce4] bg-white text-[#596472] hover:bg-[#f6f8fb]"
                : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10",
            )}
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 overflow-hidden rounded-full",
          tone === "light" ? "bg-[#e6eaf0]" : "bg-black/30",
        )}
      >
        <div
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            failed
              ? tone === "light"
                ? "bg-rose-500"
                : "bg-rose-300"
              : completed
                ? tone === "light"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
                : tone === "light"
                  ? "bg-[#516273]"
                  : "bg-cyan-300",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
