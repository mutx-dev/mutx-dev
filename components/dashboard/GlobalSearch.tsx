"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { type DashboardNavItem, DASHBOARD_NAV_ITEMS, filterNavItems } from "./dashboardNav";
import { dashboardTokens } from "./tokens";

export interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = filterNavItems(DASHBOARD_NAV_ITEMS, query);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: DashboardNavItem) => {
      router.push(item.href);
      onClose();
    },
    [router, onClose],
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(results.length, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
      } else if (event.key === "Enter" && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, activeIndex, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: dashboardTokens.bgSurfaceStrong,
          borderColor: dashboardTokens.borderSubtle,
          boxShadow: dashboardTokens.shadowLg,
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: dashboardTokens.borderSubtle }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: dashboardTokens.textMuted }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            style={{ color: dashboardTokens.textPrimary }}
            aria-label="Search dashboard pages"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-0.5 text-slate-500 hover:text-slate-300"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd
              className="hidden rounded border px-1.5 py-0.5 text-[10px] sm:block"
              style={{
                borderColor: dashboardTokens.borderSubtle,
                color: dashboardTokens.textMuted,
              }}
            >
              esc
            </kbd>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.length > 0 ? (
            <ul role="listbox" aria-label="Search results">
              {results.map((item, index) => (
                <li key={item.href} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      index === activeIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(item)}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "rgba(56, 189, 248, 0.08)" }}
                    >
                      <item.icon className="h-4 w-4 text-cyan-400/70" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-sm font-medium"
                        style={{ color: dashboardTokens.textPrimary }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="block truncate text-[11px] uppercase tracking-[0.14em]"
                        style={{ color: dashboardTokens.textMuted }}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm" style={{ color: dashboardTokens.textMuted }}>
              No pages match &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Keyboard hint footer */}
        <div
          className="flex items-center gap-4 border-t px-4 py-2"
          style={{ borderColor: dashboardTokens.borderSubtle }}
        >
          {(
            [
              { keys: "↑↓", hint: "navigate" },
              { keys: "↵", hint: "open" },
              { keys: "esc", hint: "close" },
            ] as const
          ).map(({ keys, hint }) => (
            <span
              key={hint}
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: dashboardTokens.textMuted }}
            >
              <kbd
                className="rounded border px-1 py-0.5 font-mono"
                style={{ borderColor: dashboardTokens.borderSubtle }}
              >
                {keys}
              </kbd>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
