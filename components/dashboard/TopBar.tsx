"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

export interface TopBarBreadcrumb {
  label: string;
  href?: string;
}

export interface TopBarUser {
  name: string;
  email?: string;
  initials?: string;
  avatar?: ReactNode;
}

export interface TopBarUserAction {
  label: string;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
}

export interface TopBarProps {
  breadcrumbs?: TopBarBreadcrumb[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  user?: TopBarUser;
  userActions?: TopBarUserAction[];
  className?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/g).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export function TopBar({
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  user,
  userActions = [],
  className,
}: TopBarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <header
      className={cn("sticky top-0 z-20 border-b px-6 py-4 backdrop-blur-md", className)}
      style={{
        backgroundColor: "color-mix(in srgb, transparent 18%, black)",
        borderColor: dashboardTokens.borderSubtle,
        color: dashboardTokens.textPrimary,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          {breadcrumbs.length > 0 ? (
            <nav
              className="flex items-center gap-1 text-xs"
              aria-label="Breadcrumb"
              style={{ color: dashboardTokens.textMuted }}
            >
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                  {crumb.href ? (
                    <Link className="transition-colors hover:opacity-90" href={crumb.href}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-sm" style={{ color: dashboardTokens.textSubtle }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgSurfaceStrong,
                }}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold"
                  style={{
                    backgroundColor: dashboardTokens.bgSubtle,
                    color: dashboardTokens.textPrimary,
                    fontFamily: dashboardTokens.fontMono,
                  }}
                >
                  {user.avatar ?? user.initials ?? getInitials(user.name)}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  {user.email ? (
                    <span className="block truncate text-xs" style={{ color: dashboardTokens.textMuted }}>
                      {user.email}
                    </span>
                  ) : null}
                </span>
              </button>

              {open ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 min-w-[220px] overflow-hidden rounded-lg border py-1 shadow-2xl"
                  style={{
                    borderColor: dashboardTokens.borderSubtle,
                    backgroundColor: dashboardTokens.bgSurfaceStrong,
                    boxShadow: dashboardTokens.shadowLg,
                  }}
                >
                  {userActions.map((action, index) => {
                    const rowClass = cn(
                      "block w-full px-3 py-2 text-left text-sm transition-colors",
                      action.destructive ? "text-rose-300" : undefined,
                    );

                    const rowStyle = {
                      color: action.destructive ? "var(--swarm-color-status-error-text, #fda4af)" : dashboardTokens.textSubtle,
                    };

                    if (action.href) {
                      return (
                        <Link
                          key={`${action.label}-${index}`}
                          href={action.href}
                          className={rowClass}
                          style={rowStyle}
                          onClick={() => setOpen(false)}
                          role="menuitem"
                        >
                          {action.label}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={`${action.label}-${index}`}
                        type="button"
                        className={rowClass}
                        style={rowStyle}
                        onClick={() => {
                          action.onSelect?.();
                          setOpen(false);
                        }}
                        role="menuitem"
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
