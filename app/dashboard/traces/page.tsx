"use client";

import { useState } from "react";
import { Search, Filter, Play, Pause, AlertCircle, ChevronRight, Clock, Tag, X, CheckCircle, XCircle } from "lucide-react";

interface TraceEntry {
  id: string;
  trace_id: string;
  agent: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, string>;
}

const mockTraces: TraceEntry[] = [
  { id: "t1", trace_id: "trace_abc123", agent: "claude-sonnet", level: "info", message: "Agent initialized with model claude-sonnet-4", timestamp: "2026-03-16T07:35:00Z", duration: 245 },
  { id: "t2", trace_id: "trace_abc123", agent: "claude-sonnet", level: "debug", message: "Tool selection: searching knowledge base", timestamp: "2026-03-16T07:35:01Z", metadata: { tool: "search", query: "deployment config" } },
  { id: "t3", trace_id: "trace_abc123", agent: "claude-sonnet", level: "info", message: "Retrieved 3 relevant documents", timestamp: "2026-03-16T07:35:02Z", metadata: { documents: "3", latency: "124ms" } },
  { id: "t4", trace_id: "trace_def456", agent: "gpt-operator", level: "warn", message: "Rate limit approaching for OpenAI API", timestamp: "2026-03-16T07:34:00Z", metadata: { remaining: "45", total: "500" } },
  { id: "t5", trace_id: "trace_def456", agent: "gpt-operator", level: "error", message: "Failed to complete request: context length exceeded", timestamp: "2026-03-16T07:34:05Z" },
  { id: "t6", trace_id: "trace_ghi789", agent: "codex-agent", level: "info", message: "Executing code generation task", timestamp: "2026-03-16T07:33:00Z", duration: 1240 },
  { id: "t7", trace_id: "trace_ghi789", agent: "codex-agent", level: "debug", message: "Files modified: 3, Lines added: 156", timestamp: "2026-03-16T07:33:02Z" },
  { id: "t8", trace_id: "trace_ghi789", agent: "codex-agent", level: "info", message: "Code generation completed successfully", timestamp: "2026-03-16T07:33:04Z", duration: 1240 },
];

const levelColors = {
  info: { bg: "bg-cyan-400/10", text: "text-cyan-400", border: "border-cyan-400/20" },
  warn: { bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20" },
  error: { bg: "bg-rose-400/10", text: "text-rose-400", border: "border-rose-400/20" },
  debug: { bg: "bg-slate-400/10", text: "text-slate-400", border: "border-slate-400/20" },
};

export default function DashboardTracesPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);

  const agents = Array.from(new Set(mockTraces.map(t => t.agent)));
  
  const filteredTraces = mockTraces.filter(trace => {
    const matchesSearch = trace.message.toLowerCase().includes(search.toLowerCase()) || trace.trace_id.includes(search);
    const matchesLevel = levelFilter === "all" || trace.level === levelFilter;
    const matchesAgent = agentFilter === "all" || trace.agent === agentFilter;
    return matchesSearch && matchesLevel && matchesAgent;
  });

  const groupedTraces = filteredTraces.reduce((acc, trace) => {
    if (!acc[trace.trace_id]) acc[trace.trace_id] = [];
    acc[trace.trace_id].push(trace);
    return acc;
  }, {} as Record<string, TraceEntry[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Traces</h1>
            <p className="mt-1 text-sm text-slate-400">Structured execution traces with correlation IDs</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search traces by ID or message..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
            <option value="all">All Agents</option>
            {agents.map(agent => <option key={agent} value={agent}>{agent}</option>)}
          </select>
        </div>
      </div>

      {/* Trace Groups */}
      <div className="space-y-4">
        {Object.entries(groupedTraces).map(([traceId, traces]) => {
          const first = traces[0];
          const hasError = traces.some(t => t.level === "error");
          const totalDuration = traces.find(t => t.duration)?.duration || 0;
          
          return (
            <div key={traceId} className="rounded-xl border border-white/10 bg-[#0a0a0e] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/5">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-cyan-400">{traceId}</span>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">{first.agent}</span>
                  {hasError && <span className="flex items-center gap-1 text-xs text-rose-400"><XCircle className="h-3 w-3" /> Error</span>}
                  {totalDuration > 0 && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{totalDuration}ms</span>}
                </div>
                <button onClick={() => setSelectedTrace(selectedTrace === traceId ? null : traceId)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                  {selectedTrace === traceId ? "Hide" : "Show"} {traces.length} events
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedTrace === traceId ? "rotate-90" : ""}`} />
                </button>
              </div>
              
              {selectedTrace === traceId && (
                <div className="divide-y divide-white/5">
                  {traces.map((trace) => {
                    const colors = levelColors[trace.level];
                    return (
                      <div key={trace.id} className="flex gap-4 px-6 py-3 hover:bg-white/5">
                        <div className="mt-0.5 flex-shrink-0">
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${colors.bg} ${colors.text} ${colors.border}`}>
                            {trace.level}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{trace.message}</p>
                          {trace.metadata && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(trace.metadata).map(([k, v]) => (
                                <span key={k} className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                                  <Tag className="h-2.5 w-2.5" />{k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-slate-500">
                          {new Date(trace.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTraces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-white">No traces found</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
