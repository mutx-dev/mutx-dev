import type { ReactNode } from "react";
import { AlertTriangle, Lock, RefreshCcw, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";

import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";

type LoadingVariant = "cards" | "rows" | "detail";

interface ShellLoadingStateProps {
  className?: string;
  count?: number;
  label?: string;
  variant?: LoadingVariant;
}

interface ShellErrorStateProps {
  className?: string;
  cta?: ReactNode;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
}

interface ShellAuthRequiredStateProps {
  className?: string;
  message?: string;
}

interface ShellNotFoundStateProps {
  className?: string;
  cta?: ReactNode;
  message?: string;
  title?: string;
}

export function ShellLoadingState({
  className,
  count = 3,
  label = "Loading dashboard data",
  variant = "cards",
}: ShellLoadingStateProps) {
  return (
    <section className={cn("space-y-4", className)} aria-live="polite" aria-busy>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <LoadingState variant={variant} count={count} />
    </section>
  );
}

export function ShellErrorState({
  className,
  cta,
  message,
  onRetry,
  retryLabel = "Retry",
  title = "Failed to load dashboard data",
}: ShellErrorStateProps) {
  return (
    <EmptyState
      className={className}
      title={title}
      message={message}
      icon={<AlertTriangle className="h-7 w-7 text-rose-300" />}
      cta={
        cta ??
        (onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-300/30 bg-rose-400/10 px-4 text-sm font-medium text-rose-200 hover:bg-rose-400/20"
          >
            <RefreshCcw className="h-4 w-4" />
            {retryLabel}
          </button>
        ) : undefined)
      }
    />
  );
}

export function ShellAuthRequiredState({
  className,
  message = "Sign in to access this dashboard section.",
}: ShellAuthRequiredStateProps) {
  return (
    <EmptyState
      className={className}
      title="Sign in required"
      message={message}
      icon={<Lock className="h-7 w-7 text-cyan-300" />}
      ctaLabel="Sign in"
      ctaHref="/login"
    />
  );
}

export function ShellNotFoundState({
  className,
  cta,
  message = "The requested resource could not be found.",
  title = "Resource not found",
}: ShellNotFoundStateProps) {
  return (
    <EmptyState
      className={className}
      title={title}
      message={message}
      icon={<SearchX className="h-7 w-7 text-slate-300" />}
      cta={cta}
    />
  );
}
