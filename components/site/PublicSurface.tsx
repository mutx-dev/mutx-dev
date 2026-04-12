import type { ReactNode } from "react";

import { appFontVariables } from "@/app/fonts/app";
import { cn } from "@/lib/utils";

type PublicSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function PublicSurface({ children, className }: PublicSurfaceProps) {
  return <div className={cn(appFontVariables, className)}>{children}</div>;
}
