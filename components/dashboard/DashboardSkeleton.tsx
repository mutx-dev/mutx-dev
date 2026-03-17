import { cn } from "@/lib/utils";
import { dashboardTokens } from "./tokens";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ backgroundColor: dashboardTokens.bgSubtle }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="mt-2 h-4 w-56" />
        </div>
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`stat-${i}`}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-2 h-9 w-12" />
          </div>
        ))}
      </div>

      {/* Quick Links Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`card-${i}`}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-4 w-14" />
            </div>
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-11/12" />
              <SkeletonBlock className="h-3 w-10/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
