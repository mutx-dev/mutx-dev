"use client";

import { ControlErrorFallback } from "@/components/dashboard/demo/ControlErrorFallback";

export default function ControlError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ControlErrorFallback reset={reset} />;
}
