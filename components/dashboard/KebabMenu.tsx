"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

export interface KebabMenuAction {
  label: string;
  onSelect?: () => void;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  destructive?: boolean;
}

export interface KebabMenuProps {
  actions: KebabMenuAction[];
  align?: "start" | "end";
  className?: string;
}

export function KebabMenu({ actions, align = "end", className }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div className={cn("relative inline-flex", className)} ref={containerRef}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors"
        style={{
          borderColor: dashboardTokens.borderSubtle,
          backgroundColor: dashboardTokens.bgSurfaceStrong,
          color: dashboardTokens.textSubtle,
        }}
        aria-label="Open row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-lg border py-1 shadow-2xl",
            align === "end" ? "right-0" : "left-0",
          )}
          style={{
            borderColor: dashboardTokens.borderSubtle,
            backgroundColor: dashboardTokens.bgSurfaceStrong,
            boxShadow: dashboardTokens.shadowLg,
          }}
        >
          {actions.map((action, index) => {
            const color = action.destructive
              ? "var(--swarm-color-status-error-text, #fda4af)"
              : dashboardTokens.textSubtle;

            const rowContent = (
              <>
                {action.icon ? <action.icon className="h-4 w-4 shrink-0" /> : null}
                <span>{action.label}</span>
              </>
            );

            const rowClassName = cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
              action.disabled ? "cursor-not-allowed opacity-45" : undefined,
            );

            if (action.href && !action.disabled) {
              return (
                <Link
                  key={`${action.label}-${index}`}
                  href={action.href}
                  className={rowClassName}
                  style={{ color }}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  {rowContent}
                </Link>
              );
            }

            return (
              <button
                key={`${action.label}-${index}`}
                type="button"
                className={rowClassName}
                style={{ color }}
                disabled={action.disabled}
                role="menuitem"
                onClick={() => {
                  action.onSelect?.();
                  setOpen(false);
                }}
              >
                {rowContent}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
