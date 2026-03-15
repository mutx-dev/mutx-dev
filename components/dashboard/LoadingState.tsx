import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "cards" | "rows" | "detail";
  count?: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ backgroundColor: dashboardTokens.bgSubtle }}
    />
  );
}

function CardSkeleton() {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgSurface,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-11/12" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgSurface,
      }}
    >
      <SkeletonBlock className="h-8 w-8 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-40" />
        <SkeletonBlock className="h-3 w-52" />
      </div>
      <SkeletonBlock className="h-5 w-16 rounded-full" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgSurface,
      }}
    >
      <SkeletonBlock className="h-5 w-48" />
      <div className="mt-4 grid gap-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function LoadingState({
  variant = "cards",
  count = 3,
  className,
  style,
  ...props
}: LoadingStateProps) {
  const items = Array.from({ length: count });

  return (
    <div className={cn("space-y-3", className)} style={style} {...props}>
      {items.map((_, index) => {
        if (variant === "rows") {
          return <RowSkeleton key={`row-${index}`} />;
        }

        if (variant === "detail") {
          return <DetailSkeleton key={`detail-${index}`} />;
        }

        return <CardSkeleton key={`card-${index}`} />;
      })}
    </div>
  );
}
