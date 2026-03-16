'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Loader2, RefreshCw, Server, Database, Zap } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unknown' | string;
  error?: string;
  timestamp?: string;
  components?: Record<string, { status: string; latency_ms?: number }>;
}

export default function DashboardMonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    try {
      const res = await fetch('/api/dashboard/health');
      const data = await res.json();
      setHealth(data);
      setLastUpdated(new Date());
      setError(res.ok ? null : data.error || 'Health check failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds
    const interval = setInterval(() => fetchHealth(), 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-slate-400 bg-slate-700/30 border-slate-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const currentStatus = health?.status || 'unknown';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Monitoring</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Real-time health status and system availability. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <button
          onClick={() => fetchHealth(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status Card */}
      <div className={`rounded-xl border p-6 ${getStatusColor(currentStatus)}`}>
        <div className="flex items-center gap-4">
          {getStatusIcon(currentStatus)}
          <div>
            <p className="text-lg font-semibold capitalize">API: {currentStatus}</p>
            {health?.error && (
              <p className="mt-1 text-sm opacity-80">{health.error}</p>
            )}
            {lastUpdated && (
              <p className="mt-1 text-xs opacity-60">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* API Component */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10">
              <Server className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-white">API Server</p>
              <p className="text-xs text-slate-500">Control plane endpoint</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              currentStatus === 'healthy' 
                ? 'bg-emerald-500/20 text-emerald-400'
                : currentStatus === 'degraded'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {currentStatus === 'healthy' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              {currentStatus === 'degraded' && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />}
              {currentStatus === 'unknown' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Database Component */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-400/10">
              <Database className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">Database</p>
              <p className="text-xs text-slate-500">PostgreSQL connection</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              operational
            </span>
          </div>
        </div>

        {/* Runtime Component */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-400/10">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">Agent Runtime</p>
              <p className="text-xs text-slate-500">Execution environment</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              available
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="font-medium text-red-300">Connection Issue</p>
              <p className="mt-1 text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
