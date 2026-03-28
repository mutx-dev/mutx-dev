import type { ReactNode } from "react";

import {
  marketingAccent,
  marketingDisplay,
  marketingMono,
  marketingSans,
} from "@/app/fonts/marketing";
import { cn } from "@/lib/utils";

type PublicSurfaceProps = {
  children: ReactNode;
  className?: string;
};

const publicFontVariables = [
  marketingSans.variable,
  marketingDisplay.variable,
  marketingMono.variable,
  marketingAccent.variable,
].join(" ");

export function PublicSurface({ children, className }: PublicSurfaceProps) {
  return <div className={cn(publicFontVariables, className)}>{children}</div>;
}
