"use client";

import { AgentsPageClient } from "@/components/app/AgentsPageClient";

export default function DashboardAgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
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
            <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            <path d="M14.5 4a2 2 0 0 1 1.665 1.014" />
            <path d="M18.5 7a2 2 0 0 1 .777 3.333" />
            <path d="M18 16.5a2 2 0 0 1-1.333 1.833" />
            <path d="M12 22a2 2 0 0 1 0-4 2 2 0 0 1 0 4Z" />
            <path d="M9.5 18.5a2 2 0 0 1-1.665-1.014" />
            <path d="M5.5 17a2 2 0 0 1-.777-3.333" />
            <path d="M6 7.5a2 2 0 0 1 1.333-1.833" />
            <path d="M12 2v20" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your agent fleet
          </p>
        </div>
      </div>
      <AgentsPageClient />
    </div>
  );
}
