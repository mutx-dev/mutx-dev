"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Search, Trash2, Plus, HardDrive, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryStore {
  id: string;
  name: string;
  type: "vector" | "keyval" | "document";
  size: string;
  embeddings: number;
  lastUpdated: string;
  status: "active" | "idle" | "syncing";
}

interface MemoryResponse {
  stores: MemoryStore[];
}

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
  const [stores, setStores] = useState<MemoryStore[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/memory", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: MemoryResponse = await res.json();
      setStores(data.stores ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMemory();
  }, [fetchMemory]);

  const filteredMemory = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || store.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalEmbeddings = stores.reduce((sum, m) => sum + m.embeddings, 0);

  const totalSizeGB = stores.reduce((sum, m) => {
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

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="text-sm text-white">Sign in to view your memory stores.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Stores</p>
              <p className="text-xl font-semibold text-white">
                {loading ? "—" : stores.length}
              </p>
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
              <p className="text-xl font-semibold text-white">
                {loading ? "—" : `${totalSizeGB.toFixed(1)} GB`}
              </p>
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
              <p className="text-xl font-semibold text-white">
                {loading ? "—" : totalEmbeddings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search memory stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchMemory()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
              loading && "opacity-50 cursor-not-allowed"
            )}
            disabled={loading}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          {["all", "vector", "keyval", "document"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                typeFilter === type
                  ? "bg-cyan-400/20 text-cyan-400"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="overflow-x-auto">
          {loading && stores.length === 0 ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 py-4 animate-pulse">
                  <div className="h-4 w-32 rounded bg-white/5" />
                  <div className="h-5 w-16 rounded-full bg-white/5" />
                  <div className="h-4 w-12 rounded bg-white/5" />
                  <div className="h-4 w-16 rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : filteredMemory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Database className="mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No memory stores found</p>
            </div>
          ) : (
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
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-cyan-400">{store.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${typeColors[store.type]}`}
                        >
                          {store.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{store.size}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {store.embeddings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                          <span className={`text-sm ${status.color}`}>{store.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(store.lastUpdated).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-400/10 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
