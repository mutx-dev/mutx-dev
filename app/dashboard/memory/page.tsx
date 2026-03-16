"use client";

import { useState } from "react";
import { Database, Search, Trash2, Plus, HardDrive, Clock, Sparkles } from "lucide-react";

interface MemoryStore {
  id: string;
  name: string;
  type: "vector" | "keyval" | "document";
  size: string;
  embeddings: number;
  lastUpdated: string;
  status: "active" | "idle" | "syncing";
}

const mockMemory: MemoryStore[] = [
  { id: "mem_001", name: "agent-context-default", type: "vector", size: "2.4GB", embeddings: 15420, lastUpdated: "2026-03-16T07:30:00Z", status: "active" },
  { id: "mem_002", name: "codex-session-store", type: "keyval", size: "456MB", embeddings: 0, lastUpdated: "2026-03-16T07:25:00Z", status: "active" },
  { id: "mem_003", name: "run-history-archive", type: "document", size: "12.1GB", embeddings: 0, lastUpdated: "2026-03-16T06:00:00Z", status: "idle" },
  { id: "mem_004", name: "rag-knowledge-base", type: "vector", size: "8.7GB", embeddings: 89450, lastUpdated: "2026-03-16T07:35:00Z", status: "syncing" },
];

const typeColors = {
  vector: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  keyval: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  document: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

const statusConfig = {
  active: { color: "text-emerald-400", dot: "bg-emerald-400" },
  idle: { color: "text-slate-400", dot: "bg-slate-400" },
  syncing: { color: "text-amber-400", dot: "bg-amber-400 animate-pulse" },
};

export default function DashboardMemoryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredMemory = mockMemory.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || store.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalEmbeddings = mockMemory.reduce((sum, m) => sum + m.embeddings, 0);
  const totalSize = mockMemory.reduce((sum, m) => {
    const num = parseFloat(m.size);
    return sum + (m.size.includes("GB") ? num : num / 1024);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Memory</h1>
            <p className="mt-1 text-sm text-slate-400">Agent memory stores and vector embeddings</p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-colors">
          <Plus className="h-4 w-4" />
          New Memory Store
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Stores</p>
              <p className="text-xl font-semibold text-white">{mockMemory.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10">
              <HardDrive className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Size</p>
              <p className="text-xl font-semibold text-white">{totalSize.toFixed(1)} GB</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Embeddings</p>
              <p className="text-xl font-semibold text-white">{totalEmbeddings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search memory stores..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {["all", "vector", "keyval", "document"].map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${typeFilter === type ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:bg-white/5"}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium">Embeddings</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMemory.map((store) => {
                const status = statusConfig[store.status];
                return (
                  <tr key={store.id} className="group hover:bg-white/5">
                    <td className="px-6 py-4"><span className="font-mono text-sm text-cyan-400">{store.name}</span></td>
                    <td className="px-6 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${typeColors[store.type]}`}>{store.type}</span></td>
                    <td className="px-6 py-4 text-slate-300">{store.size}</td>
                    <td className="px-6 py-4 text-slate-300">{store.embeddings.toLocaleString()}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${status.dot}`} /><span className={`text-sm ${status.color}`}>{store.status}</span></div></td>
                    <td className="px-6 py-4 text-slate-400">{new Date(store.lastUpdated).toLocaleString()}</td>
                    <td className="px-6 py-4"><button className="rounded-lg p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
