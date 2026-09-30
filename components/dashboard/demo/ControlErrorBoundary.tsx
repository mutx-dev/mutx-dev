"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { ControlErrorFallback } from "@/components/dashboard/demo/ControlErrorFallback";

export function ControlErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback={(reset) => <ControlErrorFallback reset={reset} />}>{children}</ErrorBoundary>;
}
