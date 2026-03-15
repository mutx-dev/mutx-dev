"use client";

import { Activity } from 'lucide-react';
import { LogsMetricsStateClient } from '@/components/app/LogsMetricsStateClient';

export default function ObservabilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Observability</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time logs, metrics, and state transitions
          </p>
        </div>
      </div>
      <LogsMetricsStateClient />
    </div>
  );
}
