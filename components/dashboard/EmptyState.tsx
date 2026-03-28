import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  message: string;
  icon?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  cta?: ReactNode;
}

export function EmptyState({
  title,
  message,
  icon,
  ctaLabel,
  ctaHref,
  onCtaClick,
  cta,
  className,
  style,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "dashboard-entry flex flex-col items-center justify-center rounded-[22px] border px-6 py-12 text-center",
        className,
      )}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradient,
        color: dashboardTokens.textPrimary,
        boxShadow: dashboardTokens.shadowSm,
        ...style,
      }}
      {...props}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[18px] border"
        style={{
          borderColor: dashboardTokens.borderStrong,
          backgroundColor: dashboardTokens.bgSurfaceStrong,
          color: dashboardTokens.brand,
        }}
      >
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
        {message}
      </p>

      {cta ? <div className="mt-5">{cta}</div> : null}
      {!cta && ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex h-10 items-center rounded-[12px] px-4 text-sm font-medium"
          style={{
            backgroundColor: dashboardTokens.brand,
            color: dashboardTokens.bgCanvas,
          }}
        >
          {ctaLabel}
        </Link>
      ) : null}
      {!cta && ctaLabel && !ctaHref && onCtaClick ? (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-5 inline-flex h-10 items-center rounded-[12px] px-4 text-sm font-medium"
          style={{
            backgroundColor: dashboardTokens.brand,
            color: dashboardTokens.bgCanvas,
          }}
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
