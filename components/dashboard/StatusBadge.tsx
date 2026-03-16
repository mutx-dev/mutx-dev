import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { statusTokens, dashboardTokens } from "./tokens";
import type { DashboardStatus } from "./types";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: DashboardStatus;
  label?: string;
}

export function StatusBadge({ status, label, className, style, ...props }: StatusBadgeProps) {
  const tone = statusTokens[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        className,
      )}
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.text,
        fontFamily: dashboardTokens.fontMono,
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
      />
      {label ?? status}
    </span>
  );
}
