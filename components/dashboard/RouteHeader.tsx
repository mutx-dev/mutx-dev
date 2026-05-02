import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardTokens } from "@/components/dashboard/tokens";
import { FeatureHint, type FeatureHintProps } from "@/components/dashboard/FeatureHint";

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
  hint?: FeatureHintProps;
}

function getStatToneClass(tone: RouteHeaderStat["tone"]) {
  switch (tone) {
    case "success":
      return "border-[#2563eb]/40 bg-[#0f1f3c] text-[#dbeafe]";
    case "warning":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "danger":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
    default:
      return "border-[#2b436e] bg-[#0d1728] text-[#dbeafe]";
  }
}

export function RouteHeader({
  title,
  description,
  icon: Icon,
  iconTone = "text-[#dbeafe] bg-[#16233a] border-[#315487]",
  badge,
  stats = [],
  className,
  hint,
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
          "radial-gradient(circle at top right, rgba(96,165,250,0.14), transparent 22%), linear-gradient(180deg, rgba(20,29,45,0.98) 0%, rgba(8,12,20,0.98) 100%)",
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
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: dashboardTokens.textMuted }}
                  >
                    {badge}
                  </p>
                  {hint ? <FeatureHint {...hint} align="left" /> : null}
                </div>
              ) : null}
              <h1
                className="font-[family:var(--font-site-display)] text-[1.5rem] font-semibold tracking-[-0.06em] sm:text-[1.8rem]"
                style={{ color: dashboardTokens.textPrimary }}
              >
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
              This route is mounted inside the unified dashboard shell and ready for live data.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
