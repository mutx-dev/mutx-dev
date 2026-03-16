"use client";

import { useState } from "react";
import { FileText, Search, Filter, Download, Play, Pause, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/dashboard/ui";

const logs = [
  { id: "1", timestamp: "2026-03-15 23:45:12", level: "info", source: "assistant-prod-01", message: "Agent started successfully" },
  { id: "2", timestamp: "2026-03-15 23:45:10", level: "info", source: "api-gateway", message: "Request received: POST /api/chat" },
  { id: "3", timestamp: "2026-03-15 23:45:08", level: "warn", source: "coder-worker-02", message: "Rate limit approaching: 95% of quota" },
  { id: "4", timestamp: "2026-03-15 23:45:05", level: "error", source: "data-processor", message: "Failed to connect to database: timeout" },
  { id: "5", timestamp: "2026-03-15 23:45:02", level: "info", source: "research-main", message: "Search completed: 12 results found" },
  { id: "6", timestamp: "2026-03-15 23:44:58", level: "info", source: "assistant-prod-01", message: "Processing user query: 'Hello'" },
];

const levelColors = {
  info: "text-signal-accent bg-signal-accent/10",
  warn: "text-yellow-500 bg-yellow-500/10",
  error: "text-red-400 bg-red-400/10",
  debug: "text-text-secondary bg-bg-surface",
};

export default function DashboardLogsPage() {
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (sourceFilter && log.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Logs</h1>
          <p className="mt-1 text-sm text-text-secondary">Runtime log viewer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Play className="h-4 w-4" />
            Live
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input placeholder="Search logs..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={levelFilter === null ? "primary" : "secondary"}
                onClick={() => setLevelFilter(null)}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={levelFilter === "info" ? "primary" : "secondary"}
                onClick={() => setLevelFilter("info")}
              >
                <Info className="h-3 w-3" />
                Info
              </Button>
              <Button
                size="sm"
                variant={levelFilter === "warn" ? "primary" : "secondary"}
                onClick={() => setLevelFilter("warn")}
              >
                <AlertTriangle className="h-3 w-3" />
                Warn
              </Button>
              <Button
                size="sm"
                variant={levelFilter === "error" ? "primary" : "secondary"}
                onClick={() => setLevelFilter("error")}
              >
                <AlertCircle className="h-3 w-3" />
                Error
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 rounded-lg border border-border-subtle bg-bg-canvas p-3 font-mono text-sm"
              >
                <span className="shrink-0 text-xs text-text-secondary">{log.timestamp}</span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${levelColors[log.level as keyof typeof levelColors]}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="shrink-0 text-xs text-signal-accent">[{log.source}]</span>
                <span className="text-text-primary">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
