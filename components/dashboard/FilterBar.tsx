"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardTokens } from "./tokens";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterControl {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (nextValue: string) => void;
}

export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  searchValue: string;
  onSearchChange: (nextValue: string) => void;
  searchPlaceholder?: string;
  filters?: FilterControl[];
  trailing?: ReactNode;
  onReset?: () => void;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  trailing,
  onReset,
  className,
  style,
  ...props
}: FilterBarProps) {
  const canReset = Boolean(onReset) && (searchValue.length > 0 || filters.some((filter) => filter.value.length > 0));

  return (
    <section
      className={cn("rounded-xl border p-3", className)}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgSurface,
        ...style,
      }}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex min-h-10 min-w-[240px] flex-1 items-center gap-2 rounded-lg border px-3"
          style={{
            borderColor: dashboardTokens.borderSubtle,
            backgroundColor: dashboardTokens.bgSurfaceStrong,
            color: dashboardTokens.textSubtle,
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: dashboardTokens.textMuted }} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            className="w-full border-0 bg-transparent text-sm outline-none"
            style={{ color: dashboardTokens.textPrimary }}
            aria-label={searchPlaceholder}
          />
        </div>

        {filters.length > 0 ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em]"
              style={{ color: dashboardTokens.textMuted }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </span>
            {filters.map((filter) => (
              <label
                key={filter.id}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgSurfaceStrong,
                  color: dashboardTokens.textSubtle,
                }}
              >
                <span className="text-xs" style={{ color: dashboardTokens.textMuted }}>
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.currentTarget.value)}
                  className="rounded border-0 bg-transparent text-sm outline-none"
                  style={{ color: dashboardTokens.textPrimary }}
                  aria-label={filter.label}
                >
                  {filter.options.map((option) => (
                    <option key={`${filter.id}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        {canReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1 rounded-lg border px-2.5 text-sm"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              backgroundColor: dashboardTokens.bgSurfaceStrong,
              color: dashboardTokens.textSubtle,
            }}
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        ) : null}

        {trailing ? <div className="ml-auto">{trailing}</div> : null}
      </div>
    </section>
  );
}
