"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

interface DashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DashboardDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DashboardDialogProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-[#04070c]/82 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <section
        role="dialog"
        aria-modal="true"
        className={cn("relative z-10 w-full max-w-lg overflow-hidden rounded-[24px] border", className)}
        style={{
          borderColor: dashboardTokens.borderStrong,
          background:
            "radial-gradient(circle at top right, rgba(138, 216, 255, 0.08), transparent 22%), linear-gradient(180deg, rgba(20,27,37,0.98) 0%, rgba(11,16,23,0.98) 100%)",
          boxShadow: dashboardTokens.shadowLg,
        }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: dashboardTokens.borderSubtle }}
        >
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: dashboardTokens.textMuted }}
            >
              Operator Action
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]" style={{ color: dashboardTokens.textPrimary }}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border transition hover:border-sky-300/30"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              backgroundColor: dashboardTokens.bgInset,
              color: dashboardTokens.textSubtle,
            }}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div
            className="flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4 sm:px-6"
            style={{ borderColor: dashboardTokens.borderSubtle }}
          >
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
}
