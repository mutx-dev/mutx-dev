"use client";

import { useState } from "react";
import { GitBranch, Plus, Settings, Play, Pause, ArrowRight, Trash2, Layers } from "lucide-react";

interface Lane {
  id: string;
  name: string;
  type: "builder" | "ship" | "qa" | "control";
  status: "active" | "paused" | "idle";
  concurrency: number;
  queueDepth: number;
  nextHandoff?: string;
}

const mockLanes: Lane[] = [
  { id: "lane_1", name: "backend-builder", type: "builder", status: "active", concurrency: 2, queueDepth: 5, nextHandoff: "ship-lane" },
  { id: "lane_2", name: "frontend-builder", type: "builder", status: "active", concurrency: 2, queueDepth: 3, nextHandoff: "ship-lane" },
  { id: "lane_3", name: "ship-lane", type: "ship", status: "active", concurrency: 1, queueDepth: 8 },
  { id: "lane_4", name: "qa-gate", type: "qa", status: "paused", concurrency: 1, queueDepth: 0 },
  { id: "lane_5", name: "control-tower", type: "control", status: "active", concurrency: 1, queueDepth: 2 },
];

const typeColors = {
  builder: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  ship: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  qa: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  control: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

const statusConfig = {
  active: { color: "text-emerald-400", dot: "bg-emerald-400" },
  paused: { color: "text-amber-400", dot: "bg-amber-400" },
  idle: { color: "text-slate-400", dot: "bg-slate-400" },
};

export default function DashboardOrchestrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Orchestration</h1>
            <p className="mt-1 text-sm text-slate-400">Agent lanes, handoffs, and execution graph</p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-400/20">
          <Plus className="h-4 w-4" /> New Lane
        </button>
      </div>

      {/* Lane Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockLanes.map((lane) => {
          const status = statusConfig[lane.status];
          return (
            <div key={lane.id} className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{lane.name}</h3>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeColors[lane.type]}`}>{lane.type}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    <span className={`text-sm ${status.color}`}>{lane.status}</span>
                  </div>
                </div>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <p className="text-slate-400">Concurrency</p>
                  <p className="font-medium text-white">{lane.concurrency}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Queue</p>
                  <p className="font-medium text-white">{lane.queueDepth}</p>
                </div>
              </div>
              {lane.nextHandoff && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-400">Handoff to</span>
                  <span className="text-cyan-400">{lane.nextHandoff}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Execution Graph Preview */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Execution Flow</h2>
        <div className="flex items-center justify-between">
          {["control-tower", "backend-builder", "frontend-builder", "ship-lane", "qa-gate"].map((lane, i) => (
            <div key={lane} className="flex items-center">
              <div className="flex h-12 w-32 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-slate-300">
                {lane}
              </div>
              {i < 4 && <ArrowRight className="mx-2 h-4 w-4 text-slate-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
