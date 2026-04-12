import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardTokens } from "@/components/dashboard/tokens";

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
      return "border-[#7d6a42] bg-[#31251a] text-[#f3d39b]";
    case "warning":
      return "border-[#8a6439] bg-[#352515] text-[#ffd59a]";
    case "danger":
      return "border-[#7f4333] bg-[#351d18] text-[#ffc6b5]";
    default:
      return "border-[#4d3829] bg-[#1a1411] text-[#f2dfc4]";
  }
}

export function RouteHeader({
  title,
  description,
  icon: Icon,
  iconTone = "text-[#ffddb1] bg-[#3a2a1e] border-[#6c4b34]",
  badge,
  stats = [],
  className,
}: RouteHeaderProps) {
  return (
    <section
      className={cn(
        "dashboard-entry overflow-hidden rounded-[32px] border shadow-[0_24px_64px_rgba(2,2,5,0.28)]",
        className,
      )}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background:
          "radial-gradient(circle at top right, rgba(212,171,115,0.12), transparent 22%), linear-gradient(180deg, rgba(25,23,30,0.98) 0%, rgba(13,12,16,0.98) 100%)",
      }}
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
        <div className="min-w-0 px-6 py-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border",
                iconTone,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-3">
              {badge ? (
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: dashboardTokens.textMuted }}
                >
                  {badge}
                </p>
              ) : null}
              <h1 className="font-[family:var(--font-site-display)] text-[1.5rem] font-semibold tracking-[-0.06em] text-[#fff3e2] sm:text-[1.8rem]">
                {title}
              </h1>
              <p
                className="max-w-3xl text-[13px] leading-6"
                style={{ color: dashboardTokens.textSubtle }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>

        <div
          className="border-t px-6 py-5 xl:border-l xl:border-t-0"
          style={{ borderColor: dashboardTokens.borderSubtle }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: dashboardTokens.textMuted }}
          >
            Route status
          </p>
          {stats.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {stats.map((stat) => (
                <div
                  key={`${stat.label}-${stat.value}`}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-3",
                    getStatToneClass(stat.tone),
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                    {stat.label}
                  </p>
                  <p className="font-[family:var(--font-mono)] text-[11.5px] font-semibold uppercase tracking-[0.06em]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
              This route is mounted inside the unified operator shell and ready for live data.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
