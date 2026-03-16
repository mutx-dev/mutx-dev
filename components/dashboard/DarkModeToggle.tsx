"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTheme } from "./ThemeProvider";

export interface DarkModeToggleProps {
  className?: string;
}

export function DarkModeToggle({ className }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        "light:border-black/10 light:bg-black/5 light:hover:bg-black/10",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-slate-300" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
      )}
    </button>
  );
}
