import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface RouteHeaderStat {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

interface RouteHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconTone?: string;
  badge?: string;
  stats?: RouteHeaderStat[];
  className?: string;
}

function getStatToneClass(tone: RouteHeaderStat["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "warning":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "danger":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-white/10 bg-white/[0.03] text-slate-200";
  }
}

export function RouteHeader({
  title,
  description,
  icon: Icon,
  iconTone = "text-cyan-400 bg-cyan-400/10",
  badge,
  stats = [],
  className,
}: RouteHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2.5">
          {badge ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {badge}
            </p>
          ) : null}

          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconTone)}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.7rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[1.9rem]">
                {title}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
            </div>
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className={cn("rounded-xl border px-3 py-2", getStatToneClass(stat.tone))}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-75">{stat.label}</p>
                <p className="mt-1 font-mono text-sm font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
