import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "h-10 w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-signal-accent focus:outline-none focus:ring-1 focus:ring-signal-accent disabled:cursor-not-allowed disabled:opacity-50",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
}
