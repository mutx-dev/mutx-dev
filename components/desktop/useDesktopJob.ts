"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type JobStatus = "idle" | "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  error?: string;
  result?: unknown;
}

interface DesktopJobContextValue {
  job: Job;
  runJob: (
    jobId: string,
    fn: () => Promise<unknown>,
    progressMessage?: string
  ) => Promise<unknown>;
  runSetupJob: (mode: string, assistantName: string, actionType?: string) => Promise<unknown>;
  runDoctorJob: () => Promise<unknown>;
  runControlPlaneStartJob: () => Promise<unknown>;
  runControlPlaneStopJob: () => Promise<unknown>;
  runRuntimeResyncJob: () => Promise<unknown>;
  runGovernanceRestartJob: () => Promise<unknown>;
  resetJob: () => void;
  isRunning: boolean;
}

const DesktopJobContext = createContext<DesktopJobContextValue | null>(null);

function useDesktopJobState(): DesktopJobContextValue {
  const [job, setJob] = useState<Job>({
    id: "",
    status: "idle",
    progress: 0,
    message: "",
  });

  const runJob = useCallback(
    async (
      jobId: string,
      fn: () => Promise<unknown>,
      progressMessage?: string
    ) => {
      setJob({
        id: jobId,
        status: "running",
        progress: 0,
        message: progressMessage || "Starting...",
      });

      try {
        setJob((prev) => ({
          ...prev,
          progress: 10,
          message: progressMessage || "Running...",
        }));

        const result = await fn();

        setJob({
          id: jobId,
          status: "completed",
          progress: 100,
          message: "Completed",
          result,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Job failed";
        setJob({
          id: jobId,
          status: "failed",
          progress: 0,
          message: "",
          error: errorMessage,
        });
        throw error;
      }
    },
    []
  );

  const runSetupJob = useCallback(
    async (mode: string, assistantName: string, actionType?: string) => {
      if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
        throw new Error("Not running in desktop mode");
      }

      return runJob(
        "setup",
        async () => {
          const result = await window.mutxDesktop!.bridge.setup.start(
            mode,
            assistantName,
            actionType
          );

          if (!result.success) {
            throw new Error(result.error || "Setup failed");
          }

          return result;
        },
        "Running setup..."
      );
    },
    [runJob]
  );

  const runDoctorJob = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      throw new Error("Not running in desktop mode");
    }

    return runJob("doctor", async () => {
      const result = await window.mutxDesktop!.bridge.doctor.run();
      return result;
    }, "Running diagnostics...");
  }, [runJob]);

  const runControlPlaneStartJob = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      throw new Error("Not running in desktop mode");
    }

    return runJob("controlPlaneStart", async () => {
      const result = await window.mutxDesktop!.bridge.controlPlane.start();
      if (!result.success) {
        throw new Error(result.error || "Failed to start control plane");
      }
      return result;
    }, "Starting local control plane...");
  }, [runJob]);

  const runControlPlaneStopJob = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      throw new Error("Not running in desktop mode");
    }

    return runJob("controlPlaneStop", async () => {
      const result = await window.mutxDesktop!.bridge.controlPlane.stop();
      if (!result.success) {
        throw new Error(result.error || "Failed to stop control plane");
      }
      return result;
    }, "Stopping local control plane...");
  }, [runJob]);

  const runRuntimeResyncJob = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      throw new Error("Not running in desktop mode");
    }

    return runJob("runtimeResync", async () => {
      const result = await window.mutxDesktop!.bridge.runtime.resync();
      if (!result.success) {
        throw new Error(result.error || "Failed to resync runtime");
      }
      return result;
    }, "Resyncing runtime state...");
  }, [runJob]);

  const runGovernanceRestartJob = useCallback(async () => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      throw new Error("Not running in desktop mode");
    }

    return runJob("governanceRestart", async () => {
      const result = await window.mutxDesktop!.bridge.governance.restart();
      if (!result.success) {
        throw new Error(result.error || "Failed to restart governance daemon");
      }
      return result;
    }, "Restarting governance daemon...");
  }, [runJob]);

  const resetJob = useCallback(() => {
    setJob({
      id: "",
      status: "idle",
      progress: 0,
      message: "",
    });
  }, []);

  return {
    job,
    runJob,
    runSetupJob,
    runDoctorJob,
    runControlPlaneStartJob,
    runControlPlaneStopJob,
    runRuntimeResyncJob,
    runGovernanceRestartJob,
    resetJob,
    isRunning: job.status === "running",
  };
}

export function DesktopJobProvider({ children }: { children: ReactNode }) {
  const value = useDesktopJobState();
  const memoizedValue = useMemo(
    () => value,
    [
      value.isRunning,
      value.job,
      value.resetJob,
      value.runControlPlaneStartJob,
      value.runControlPlaneStopJob,
      value.runDoctorJob,
      value.runGovernanceRestartJob,
      value.runJob,
      value.runRuntimeResyncJob,
      value.runSetupJob,
    ],
  );

  return createElement(DesktopJobContext.Provider, { value: memoizedValue }, children);
}

export function useDesktopJob() {
  const context = useContext(DesktopJobContext);
  const fallback = useDesktopJobState();

  return context ?? fallback;
}
