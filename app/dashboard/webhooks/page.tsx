"use client";

import WebhooksPageClient from "@/components/webhooks/WebhooksPageClient";

export default function DashboardWebhooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M18 16.98h-5.99c-1.1 0-1.95.68-2.95 1.76" />
            <path d="M18 21h-5.99c-1.83 0-2.98-.91-3.98-1.98" />
            <path d="M6 16.98a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
            <path d="M9.5 13.47H6" />
            <path d="M7.75 15.48h2.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Webhooks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage webhook endpoints for real-time event notifications
          </p>
        </div>
      </div>
      <WebhooksPageClient />
    </div>
  );
}
