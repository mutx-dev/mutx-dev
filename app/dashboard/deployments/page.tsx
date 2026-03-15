"use client";

import { DeploymentsPageClient } from "@/components/app/DeploymentsPageClient";

export default function DashboardDeploymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
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
            <path d="M12 2L2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Deployments</h1>
          <p className="mt-1 text-sm text-slate-400">
            View and manage your deployments
          </p>
        </div>
      </div>
      <DeploymentsPageClient />
    </div>
  );
}
