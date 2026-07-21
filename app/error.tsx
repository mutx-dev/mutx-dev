"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { SystemState } from "@/components/site/SystemState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <SystemState
      code={error.digest ? `ERR / ${error.digest}` : "ERR / UNEXPECTED"}
      eyebrow="Execution interrupted"
      title="The route stopped safely."
      description="An unexpected error interrupted this surface. The rest of the control plane is unchanged."
      detail="Retry the route. If it fails again, keep the error record for investigation."
      role="alert"
      actions={(
        <button onClick={reset} type="button">
          <RefreshCw className="h-4 w-4" />
          Retry route
        </button>
      )}
    />
  );
}
