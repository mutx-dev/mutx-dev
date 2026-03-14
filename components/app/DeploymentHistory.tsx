"use client";

import { History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";

interface DeploymentVersion {
  version: number;
  created_at: string;
  config_snapshot: Record<string, unknown>;
  status: string;
}

// Mock data for demo - will be replaced with real API
const mockVersions: DeploymentVersion[] = [
  {
    version: 3,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    config_snapshot: { replicas: 2, image: "v1.2.0" },
    status: "current",
  },
  {
    version: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    config_snapshot: { replicas: 1, image: "v1.1.0" },
    status: "superseded",
  },
  {
    version: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    config_snapshot: { replicas: 1, image: "v1.0.0" },
    status: "superseded",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function VersionItem({ version, onRollback }: { version: DeploymentVersion; onRollback: () => void }) {
  const isCurrent = version.status === "current";

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
          </p>
        </div>
      </div>
      {!isCurrent && (
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
  const [rollingBack, setRollingBack] = useState(false);

  const handleRollback = async (version: number) => {
    setRollingBack(true);
    // TODO: Wire up to real API when backend adds rollback endpoint
    // await fetch(`/api/deployments/${deploymentId}/rollback`, {
    //   method: "POST",
    //   body: JSON.stringify({ version }),
    // });
    console.log(`Rolling back deployment ${deploymentId} to version ${version}`);
    setTimeout(() => {
      setRollingBack(false);
      setIsOpen(false);
    }, 1000);
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
                onClick={() => setIsOpen(false)}
                className="text-sm text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Deployment: <span className="font-mono text-white">{deploymentId}</span>
            </p>
            <div className="space-y-2">
              {mockVersions.map((version) => (
                <VersionItem
                  key={version.version}
                  version={version}
                  onRollback={() => handleRollback(version.version)}
                />
              ))}
            </div>
            {rollingBack && (
              <p className="mt-4 text-center text-sm text-emerald-400">
                Rolling back...
              </p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
