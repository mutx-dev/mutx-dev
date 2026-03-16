import type { HTMLAttributes, ReactNode } from "react";
import { Bot, Layers3, ListTodo } from "lucide-react";

import { cn } from "@/lib/utils";

import { StatusBadge } from "./StatusBadge";
import { dashboardTokens } from "./tokens";
import type { DashboardStatus } from "./types";

export interface AgentCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  lane: string;
  currentTask: string;
  status: DashboardStatus;
  description?: string;
  updatedAt?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function AgentCard({
  name,
  lane,
  currentTask,
  status,
  description,
  updatedAt,
  icon,
  actions,
  className,
  style,
  ...props
}: AgentCardProps) {
  return (
    <article
      className={cn("rounded-xl border p-4", className)}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgSurface,
        color: dashboardTokens.textPrimary,
        borderRadius: dashboardTokens.radiusXl,
        boxShadow: dashboardTokens.shadowSm,
        ...style,
      }}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              backgroundColor: dashboardTokens.bgSubtle,
              color: dashboardTokens.textSubtle,
            }}
          >
            {icon ?? <Bot className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{name}</h3>
            {description ? (
              <p className="mt-1 text-xs" style={{ color: dashboardTokens.textMuted }}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 grid gap-2.5">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: dashboardTokens.borderSubtle,
            backgroundColor: dashboardTokens.bgSurfaceStrong,
            color: dashboardTokens.textSubtle,
          }}
        >
          <Layers3 className="h-4 w-4 shrink-0" />
          <span className="text-xs uppercase tracking-[0.08em]" style={{ color: dashboardTokens.textMuted }}>
            Lane
          </span>
          <span className="ml-auto truncate">{lane}</span>
        </div>

        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: dashboardTokens.borderSubtle,
            backgroundColor: dashboardTokens.bgSurfaceStrong,
            color: dashboardTokens.textSubtle,
          }}
        >
          <ListTodo className="h-4 w-4 shrink-0" />
          <span className="text-xs uppercase tracking-[0.08em]" style={{ color: dashboardTokens.textMuted }}>
            Task
          </span>
          <span className="ml-auto truncate text-right">{currentTask}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p
          className="truncate text-xs"
          style={{ color: dashboardTokens.textMuted, fontFamily: dashboardTokens.fontMono }}
        >
          {updatedAt ? `Updated ${updatedAt}` : "No recent update"}
        </p>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </article>
  );
}
