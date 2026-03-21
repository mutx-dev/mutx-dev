import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ComingSoonButtonProps = {
  children: ReactNode;
  className?: string;
};

export function ComingSoonButton({
  children,
  className,
}: ComingSoonButtonProps) {
  return (
    <span aria-disabled="true" className={cn("site-button-disabled", className)}>
      {children}
    </span>
  );
}
