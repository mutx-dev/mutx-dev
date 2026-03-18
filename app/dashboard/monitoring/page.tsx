import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardMonitoringPage() {
  return (
    <DashboardSectionPage
      title="Monitoring"
      description="Use the ported operator shell as the truthful landing surface for MUTX health, telemetry, and alerting work."
      badge="telemetry"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Monitoring" },
      ]}
      checks={[
        "Replace hard-coded fleet metrics and fake alerts with real MUTX health, deployment, and runtime telemetry once the backing APIs are defined.",
        "Keep this route aligned with the new dashboard shell so future monitoring panels can land without inventing OpenClaw-only controls.",
        "Use this surface for truthful uptime, error-rate, queue, and agent-health views sourced from MUTX infrastructure.",
      ]}
      aside={
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next truthful integration
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Wire this route to real monitoring data — for example health summaries,
              deployment runtime signals, and alert streams — instead of shipping fabricated
              operator numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Run note
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Route shell landed cleanly. Real observability widgets should be added here only
              when MUTX exposes trustworthy data for them.
            </p>
          </div>
        </div>
      }
    />
  );
}
