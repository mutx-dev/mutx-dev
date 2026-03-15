"use client";

import { Activity } from 'lucide-react';
import WebhooksPageClient from '@/components/webhooks/WebhooksPageClient';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Webhooks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage webhook endpoints for real-time notifications
          </p>
        </div>
      </div>
      <WebhooksPageClient />
    </div>
  );
}
