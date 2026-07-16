import type { LucideIcon } from "lucide-react";

import { FeatureHint, type FeatureHintProps } from "@/components/dashboard/FeatureHint";
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
  hint?: FeatureHintProps;
}

const STAT_TONES: Record<NonNullable<RouteHeaderStat["tone"]>, string> = {
  neutral: "text-[#5f5b54]",
  success: "text-[#146c49]",
  warning: "text-[#805600]",
  danger: "text-[#a83226]",
};

export function RouteHeader({
  title,
  description,
  icon: Icon,
  badge,
  stats = [],
  className,
  hint,
}: RouteHeaderProps) {
  return (
    <header
      className={cn(
        "dashboard-entry grid gap-8 border-b border-[#d8d3c7] pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#f04a00] text-[#fffaf3]">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <p className="font-[family:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8b877e]">
            {badge || "Operator workspace"}
          </p>
          {hint ? <FeatureHint {...hint} align="left" /> : null}
        </div>
        <h1 className="mt-5 max-w-[18ch] font-[family:var(--font-site-display)] text-[clamp(2.7rem,5vw,5.25rem)] font-light leading-[0.88] tracking-[-0.075em] text-[#191916]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-[14px] leading-6 text-[#6e6a62] sm:text-[15px]">
          {description}
        </p>
      </div>

      {stats.length > 0 ? (
        <dl className="grid min-w-[17rem] grid-cols-2 border-l border-[#d8d3c7] pl-5 sm:gap-x-8">
          {stats.map((stat) => (
            <div key={`${stat.label}-${stat.value}`}>
              <dt className="font-[family:var(--font-mono)] text-[8px] font-semibold uppercase tracking-[0.18em] text-[#9b978e]">
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "mt-2 text-[13px] font-medium",
                  STAT_TONES[stat.tone || "neutral"],
                )}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
