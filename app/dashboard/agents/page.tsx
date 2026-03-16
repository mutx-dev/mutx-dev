"use client";

import { Bot } from "lucide-react";
import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { Button } from "@/components/dashboard/ui";
import Link from "next/link";

export default function DashboardAgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-accent/10 text-signal-accent">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Agents</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your agent fleet
            </p>
          </div>
        </div>
        <Link href="/dashboard/spawn">
          <Button>New Agent</Button>
        </Link>
      </div>
      <AgentsPageClient />
    </div>
  );
}
