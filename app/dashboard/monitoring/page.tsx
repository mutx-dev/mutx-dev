import Link from "next/link";
import { Activity, ArrowRight, HeartPulse, Layers, ShieldCheck } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";

const monitoringChecks = [
  "Bind health summaries to backend uptime/status contracts once exposed by MUTX runtime APIs.",
  "Attach deployment-level latency/error views here using the same data source used in Deployments.",
  "Add alert stream panels only after alerting/event contracts are available in MUTX.",
];

export default function DashboardMonitoringPage() {
  return (
    <div className="space-y-6">
      <RouteHeader
        title="Monitoring"
        description="Truthful health, telemetry, and alerting integrations for the MUTX control plane."
        icon={Activity}
        iconTone="text-sky-400 bg-sky-400/10"
        badge="observability surface"
        stats={[
          { label: "Status", value: "Shell ready" },
          { label: "Policy", value: "No fake data", tone: "success" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <HeartPulse className="h-4 w-4" />
            Next truthful monitoring integrations
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {monitoringChecks.map((check, index) => (
              <article key={check} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Integration {String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-sm text-slate-300">{check}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Operator rule
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Monitoring must reflect real MUTX telemetry only. Keep this surface honest and wire panels as backend contracts arrive.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Layers className="h-4 w-4" />
              Adjacent control surfaces
            </div>
            <div className="mt-3 space-y-2">
              <Link href="/dashboard/deployments" className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 hover:border-cyan-400/30">
                Deployments
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
              <Link href="/dashboard" className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 hover:border-cyan-400/30">
                Overview
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
