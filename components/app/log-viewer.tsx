"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, Loader2, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";

const MAX_LOG_BUFFER = 1000;

interface LogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  source: string;
  message: string;
  session?: string;
  data?: Record<string, unknown>;
}

interface LogFilters {
  level?: string;
  source?: string;
  search?: string;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getLogLevelColor(level: string) {
  switch (level.toLowerCase()) {
    case "error":
      return "text-red-400";
    case "warn":
      return "text-yellow-400";
    case "info":
      return "text-blue-400";
    case "debug":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

function getLogLevelBg(level: string) {
  switch (level.toLowerCase()) {
    case "error":
      return "bg-red-500/10 border-l-red-500";
    case "warn":
      return "bg-yellow-500/10 border-l-yellow-500";
    case "info":
      return "bg-blue-500/10 border-l-blue-500";
    case "debug":
      return "bg-gray-500/10 border-l-gray-500";
    default:
      return "bg-secondary border-l-border";
  }
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilters>({});
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isBufferFull = logs.length >= MAX_LOG_BUFFER;

  const loadLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "200",
        ...(filters.level && { level: filters.level }),
        ...(filters.source && { source: filters.source }),
        ...(filters.search && { search: filters.search }),
      });

      const res = await fetch(`/api/dashboard/logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // silently fail — logs may not be available
      setLogs([]);
    }
  }, [filters]);

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/logs?action=sources");
      if (!res.ok) return;
      const data = await res.json();
      setAvailableSources(data.sources || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadSources();
    const interval = setInterval(loadLogs, 30_000);
    return () => clearInterval(interval);
  }, [loadLogs, loadSources]);

  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter((entry) => {
    if (filters.level && entry.level !== filters.level) return false;
    if (filters.source && entry.source !== filters.source) return false;
    if (filters.search && !entry.message.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    return true;
  });

  const handleFilterChange = (newFilters: Partial<LogFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClear = () => setLogs([]);

  const handleExportText = useCallback(() => {
    const lines = filteredLogs.map((entry) => {
      const ts = new Date(entry.timestamp).toISOString();
      return `[${ts}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
    });
    const filename = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.log`;
    downloadFile(lines.join("\n"), filename, "text/plain");
  }, [filteredLogs]);

  const handleExportJson = useCallback(() => {
    const filename = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    downloadFile(JSON.stringify(filteredLogs, null, 2), filename, "application/json");
  }, [filteredLogs]);

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Logs</h1>
        <p className="text-muted-foreground mt-2">
          System activity and agent logs
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .log
            </button>
            <button
              onClick={handleExportJson}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .json
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Level
              </label>
              <select
                value={filters.level || ""}
                onChange={(e) => handleFilterChange({ level: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Source
              </label>
              <select
                value={filters.source || ""}
                onChange={(e) => handleFilterChange({ source: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All sources</option>
                {availableSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          {isBufferFull && (
            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
              Buffer full ({MAX_LOG_BUFFER})
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              isAutoScroll
                ? "bg-green-500/15 text-green-400 border-green-500/25"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            Auto-scroll: {isAutoScroll ? "ON" : "OFF"}
          </button>
          <button onClick={scrollToBottom} className="hover:text-foreground transition-colors">
            ↓ Bottom
          </button>
        </div>
      </div>

      {/* Log display */}
      <Card className="flex-1 overflow-hidden">
        <div
          ref={logContainerRef}
          className="h-full overflow-auto p-4 space-y-2 font-mono text-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-l-4 pl-4 py-2 rounded-r-md ${getLogLevelBg(entry.level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium uppercase ${getLogLevelColor(entry.level)}`}>
                        {entry.level}
                      </span>
                      <span className="text-muted-foreground">[{entry.source}]</span>
                      {entry.session && (
                        <span className="text-muted-foreground">session:{entry.session}</span>
                      )}
                    </div>
                    <div className="mt-1 text-foreground break-words">{entry.message}</div>
                    {entry.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Additional data
                        </summary>
                        <pre className="mt-1 text-xs text-muted-foreground overflow-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
