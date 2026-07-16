"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardDialog } from "./DashboardDialog";
import {
  ALL_DASHBOARD_NAV_ITEMS,
  getDashboardNavPanel,
  type DashboardNavItem,
} from "./dashboardNav";

interface DashboardCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigateToPanel: (panel: string) => void;
  prefetchPanel: (panel: string) => void;
}

export function DashboardCommandPalette({
  open,
  onOpenChange,
  navigateToPanel,
  prefetchPanel,
}: DashboardCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ALL_DASHBOARD_NAV_ITEMS;
    return ALL_DASHBOARD_NAV_ITEMS.filter((item) =>
      `${item.title} ${item.description} ${item.group}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  const selectItem = (item: DashboardNavItem) => {
    const panel = getDashboardNavPanel(item.key);
    prefetchPanel(panel);
    navigateToPanel(panel);
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
  };

  return (
    <DashboardDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setQuery("");
          setActiveIndex(0);
        }
      }}
      title="Go anywhere"
      description="Search every operator surface without leaving the keyboard."
      className="max-w-2xl"
    >
      <div className="flex min-h-12 items-center gap-3 rounded-md border border-[#c9c3b6] bg-[#fbfaf6] px-3.5 focus-within:border-[#f04a00]">
        <Search className="h-4 w-4 shrink-0 text-[#8b877e]" aria-hidden="true" />
        <input
          data-autofocus
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && matches[activeIndex]) {
              event.preventDefault();
              selectItem(matches[activeIndex]);
            }
          }}
          placeholder="Agents, runs, budgets, security..."
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-label="Search dashboard surfaces"
          aria-controls="dashboard-command-results"
          aria-activedescendant={
            matches[activeIndex] ? `dashboard-command-${matches[activeIndex].key}` : undefined
          }
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#191916] outline-none placeholder:text-[#9b978e]"
        />
        <kbd className="rounded border border-[#d8d3c7] bg-[#f2efe6] px-1.5 py-0.5 font-[family:var(--font-mono)] text-[9px] text-[#8b877e]">
          ESC
        </kbd>
      </div>

      <div
        id="dashboard-command-results"
        role="listbox"
        aria-label="Dashboard surfaces"
        className="mt-3 max-h-[min(48vh,28rem)] space-y-1 overflow-y-auto pr-1"
      >
        {matches.length ? (
          matches.map((item, index) => {
            const active = index === activeIndex;
            const ItemIcon = item.icon;
            const panel = getDashboardNavPanel(item.key);
            return (
              <button
                id={`dashboard-command-${item.key}`}
                key={item.key}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => {
                  setActiveIndex(index);
                  prefetchPanel(panel);
                }}
                onFocus={() => setActiveIndex(index)}
                onClick={() => selectItem(item)}
                className={cn(
                  "group flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left transition-colors",
                  active ? "bg-[#191916] text-white" : "text-[#4f4b44] hover:bg-[#ece7dc]",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                    active
                      ? "border-[#484741] bg-[#24231f] text-[#f04a00]"
                      : "border-[#d8d3c7] bg-[#f5f2ea] text-[#6e6a62]",
                  )}
                >
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-xs",
                      active ? "text-[#b7b3aa]" : "text-[#8b877e]",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-[#f04a00]" : "text-[#b7b0a3]",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })
        ) : (
          <div className="rounded-md border border-dashed border-[#c9c3b6] px-4 py-8 text-center text-sm text-[#6e6a62]">
            No surface matches “{query}”.
          </div>
        )}
      </div>
    </DashboardDialog>
  );
}
