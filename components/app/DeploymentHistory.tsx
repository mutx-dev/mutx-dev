"use client";

import { History, RotateCcw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface DeploymentVersion {
  id: string;
  deployment_id: string;
  version: number;
  config_snapshot: string;
  status: string;
  created_at: string;
  rolled_back_at: string | null;
}

interface VersionHistoryResponse {
  deployment_id: string;
  items: DeploymentVersion[];
  total: number;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function parseConfigSnapshot(snapshot: string): Record<string, unknown> {
  try {
    return JSON.parse(snapshot);
  } catch {
    return {};
  }
}

function VersionItem({ version, onRollback }: { version: DeploymentVersion; onRollback: () => void }) {
  const isCurrent = version.status === "current";
  const config = parseConfigSnapshot(version.config_snapshot);

  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${isCurrent ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${isCurrent ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-slate-400"}`}>
          v{version.version}
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {isCurrent ? "Current Version" : `Version ${version.version}`}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(version.created_at)}
            {(config.replicas as number) > 0 && ` • ${config.replicas} replica${(config.replicas as number) > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      {!isCurrent && version.status !== "superseded" && (
        <button
          onClick={onRollback}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
        >
          <RotateCcw className="h-3 w-3" />
          Rollback
        </button>
      )}
    </div>
  );
}

export function DeploymentHistory({ deploymentId }: { deploymentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && versions.length === 0) {
      setLoading(true);
      fetch(`/api/dashboard/deployments/${deploymentId}?path=versions`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data: VersionHistoryResponse) => {
          setVersions(data.items || []);
          setError("");
        })
        .catch((err) => {
          setError("Failed to load version history");
          console.error("Version history error:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, deploymentId, versions.length]);

  const handleRollback = async (version: number) => {
    setRollingBack(true);
    setError("");
    try {
      const response = await fetch(
        `/api/dashboard/deployments/${deploymentId}?action=rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Rollback failed");
      }

      setVersions([]);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
      >
        <History className="h-3.5 w-3.5" />
        Versions
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Version History</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setVersions([]);
                }}
                className="text-sm text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Deployment: <span className="font-mono text-white">{deploymentId}</span>
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-500">No version history available</p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    onRollback={() => handleRollback(version.version)}
                  />
                ))}
              </div>
            )}
            {rollingBack && (
              <p className="mt-4 text-center text-sm text-emerald-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Rolling back...
              </p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
