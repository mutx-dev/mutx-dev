export type DashboardStatus = "idle" | "running" | "success" | "error" | "warning";

export type RunFlowStatus = "pending" | "running" | "completed" | "failed" | "awaiting_owner";

export interface QueueDepthEntry {
  status: RunFlowStatus;
  count: number;
  label: string;
}

export interface FlowStage {
  status: RunFlowStatus;
  count: number;
  maxCount: number;
}
