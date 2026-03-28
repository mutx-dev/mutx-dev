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
      return "border-emerald-400/24 bg-emerald-400/12 text-emerald-100";
    case "warning":
      return "border-amber-300/28 bg-amber-300/12 text-amber-100";
    case "danger":
      return "border-rose-400/24 bg-rose-400/12 text-rose-100";
    default:
      return "border-[#364151] bg-[#111821] text-[#d8e2ed]";
  }
}

export function RouteHeader({
  title,
  description,
  icon: Icon,
  iconTone = "text-sky-100 bg-sky-400/10 border-sky-400/20",
  badge,
  stats = [],
  className,
}: RouteHeaderProps) {
  return (
    <section
      className={cn(
        "dashboard-entry overflow-hidden rounded-[22px] border px-4 py-4 shadow-[0_18px_48px_rgba(2,6,12,0.26)]",
        className,
      )}
      style={{
        borderColor: "rgba(124, 143, 164, 0.2)",
        background:
          "radial-gradient(circle at top right, rgba(122, 214, 255, 0.08), transparent 22%), linear-gradient(180deg, rgba(22,29,39,0.98) 0%, rgba(13,18,25,0.98) 100%)",
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-2">
          {badge ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f92a6]">
              {badge}
            </p>
          ) : null}

          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border",
                iconTone,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.22rem] font-semibold tracking-[-0.04em] text-[#f2f7fc] sm:text-[1.38rem]">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[#a8b6c5]">{description}</p>
            </div>
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="grid min-w-0 grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:justify-end">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className={cn("rounded-[14px] border px-3 py-2.5", getStatToneClass(stat.tone))}
              >
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">{stat.label}</p>
                <p className="mt-1 font-[family:var(--font-mono)] text-[11.5px] font-semibold uppercase tracking-[0.06em]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
