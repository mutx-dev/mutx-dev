"use client";

import { Activity, BarChart3, Bot, BrainCircuit, ShieldCheck, TerminalSquare, Users, Wallet, Webhook } from "lucide-react";

import { ActivityFeed } from "@/components/app/activity-feed";
import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { DashboardOverviewPageClient } from "@/components/dashboard/DashboardOverviewPageClient";
import { DemoRoutePage } from "@/components/dashboard/DemoRoutePage";
import { AnalyticsPageClient } from "@/components/dashboard/AnalyticsPageClient";
import { AutonomyPageClient } from "@/components/dashboard/AutonomyPageClient";
import { BudgetsPageClient } from "@/components/dashboard/BudgetsPageClient";
import { LogsPageClient } from "@/components/dashboard/LogsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { SecurityPageClient } from "@/components/dashboard/SecurityPageClient";
import { SessionsPageClient } from "@/components/dashboard/SessionsPageClient";
import { SkillsPageClient } from "@/components/dashboard/SkillsPageClient";
import { DesktopControlDeck } from "@/components/desktop/DesktopControlDeck";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import WebhooksPageClient from "@/components/webhooks/WebhooksPageClient";

export function DashboardPanelView({ panel }: { panel: string }) {
  switch (panel) {
    case "overview":
      return (
        <DesktopRouteBoundary
          routeKey="home"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Overview"
                description="Fleet posture, recent execution, alert pressure, delivery health, and operator budget state in one surface."
                icon={Activity}
                iconTone="text-cyan-300 bg-cyan-400/10"
                badge="operator overview"
                stats={[
                  { label: "Shell", value: "Canonical /dashboard" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <DashboardOverviewPageClient />
            </div>
          }
        />
      );
    case "agents":
      return (
        <DesktopRouteBoundary
          routeKey="agents"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Agents"
                description="Manage your MUTX agent registry, lifecycle operations, and per-agent configuration."
                icon={Bot}
                badge="core surface"
                stats={[
                  { label: "Scope", value: "Fleet registry" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <AgentsPageClient />
            </div>
          }
        />
      );
    case "tasks":
      return (
        <DesktopRouteBoundary
          routeKey="orchestration"
          browserView={
            <DemoRoutePage
              title="Tasks"
              description="Workflow and handoff control will land here once the backend owns orchestration entities end to end."
              badge="demo orchestration"
              notes={[
                "Show truthful workflow topology once orchestration endpoints ship instead of inventing queue theater.",
                "Keep pause, resume, and concurrency controls hidden until they map to auditable backend actions.",
                "Use the same shell and density rules as the live routes so this page is ready for backend wiring, not another redesign.",
              ]}
            />
          }
        />
      );
    case "chat":
      return (
        <DesktopRouteBoundary
          routeKey="sessions"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Sessions"
                description="Assistant sessions, channel presence, and OpenClaw gateway availability from the live session contracts."
                icon={Users}
                iconTone="text-cyan-300 bg-cyan-400/10"
                badge="session surface"
                stats={[
                  { label: "Scope", value: "Gateway sessions" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <SessionsPageClient />
            </div>
          }
        />
      );
    case "activity":
      return (
        <DesktopRouteBoundary
          routeKey="history"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Activity"
                description="Recent agent and deployment activity stitched into a single operator timeline."
                icon={Activity}
                iconTone="text-slate-200 bg-white/10"
                badge="activity surface"
                stats={[
                  { label: "Scope", value: "Agents + deployments" },
                  { label: "Mode", value: "Derived feed", tone: "warning" },
                ]}
              />

              <ActivityFeed autoRefresh className="min-h-[24rem]" limit={80} />
            </div>
          }
        />
      );
    case "logs":
      return (
        <DesktopRouteBoundary
          routeKey="logs"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Logs"
                description="Real-time step timeline and execution log for agent runs. Click any run to inspect its step sequence."
                icon={TerminalSquare}
                iconTone="text-slate-200 bg-white/10"
                badge="execution trace"
                stats={[
                  { label: "Source", value: "Observability API" },
                  { label: "Data", value: "Live", tone: "success" },
                ]}
              />

              <LogsPageClient />
            </div>
          }
        />
      );
    case "cron":
      return (
        <DesktopRouteBoundary
          routeKey="monitoring"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Autonomy"
                description="Local-only operator view for the live autonomy daemon, lane state, queue depth, active runners, and recent reports."
                icon={Bot}
                iconTone="text-fuchsia-300 bg-fuchsia-400/10"
                badge="local autonomy surface"
                hint={{
                  tone: "beta",
                  detail:
                    "Autonomy is tied directly to the local daemon and repo state. The feed is real, but the operator surface is still evolving around internal workflows.",
                }}
                stats={[
                  { label: "Source", value: ".autonomy + queue", tone: "success" },
                  { label: "Scope", value: "Daemon + lanes + reports" },
                ]}
              />

              <AutonomyPageClient />
            </div>
          }
        />
      );
    case "memory":
      return (
        <DesktopRouteBoundary
          routeKey="memory"
          browserView={
            <DemoRoutePage
              title="Memory"
              description="Memory and context-management need real retention and retrieval contracts before they deserve operator controls."
              badge="demo memory"
              notes={[
                "Do not ship pretend vector-store or retention controls before the product semantics exist.",
                "This surface should become the place operators inspect memory pressure, retention windows, and context ownership.",
                "Until then, keep the route compact, honest, and visually aligned with the rest of the control plane.",
              ]}
            />
          }
        />
      );
    case "skills":
      return (
        <DesktopRouteBoundary
          routeKey="skills"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Skills"
                description="Pinned Orchestra Research imports, curated bundles, and runtime-ready skill inventory for live assistants."
                icon={BrainCircuit}
                iconTone="text-cyan-300 bg-cyan-400/10"
                badge="skillpack control"
                hint={{
                  tone: "beta",
                  detail:
                    "Skill installs are active, but runtime sync and assistant binding still have sharp edges. Treat this as an operator beta, not a final marketplace surface.",
                }}
                stats={[
                  { label: "Catalog", value: "ClawHub + Orchestra" },
                  { label: "Mode", value: "Live install", tone: "success" },
                ]}
              />

              <SkillsPageClient />
            </div>
          }
        />
      );
    case "settings":
      return <DesktopControlDeck />;
    case "tokens":
      return (
        <DesktopRouteBoundary
          routeKey="analytics"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Analytics"
                description="Usage trends, latency posture, and operator activity summaries from the live analytics contracts."
                icon={BarChart3}
                iconTone="text-fuchsia-300 bg-fuchsia-400/10"
                badge="analytics surface"
                stats={[
                  { label: "Scope", value: "Trends + usage" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <AnalyticsPageClient />
            </div>
          }
        />
      );
    case "notifications":
      return (
        <DesktopRouteBoundary
          routeKey="monitoring"
          browserView={
            <DemoRoutePage
              title="Notifications"
              description="Cross-surface alerts and inbox-style operator notifications still need a dedicated contract."
              badge="planned notifications"
              notes={[
                "Keep alerting distinct from health monitoring so the operator inbox does not collapse into a metrics page.",
                "Notification preferences, delivery channels, and acknowledgement state should ship together.",
                "Until the backend contract lands, route this panel through the SPA shell without pretending the feature is complete.",
              ]}
            />
          }
        />
      );
    case "standup":
      return (
        <DesktopRouteBoundary
          routeKey="monitoring"
          browserView={
            <DemoRoutePage
              title="Standup"
              description="Structured daily summaries are still missing the scheduling and evidence pipeline they need."
              badge="planned standup"
              notes={[
                "Do not fake a standup summary without pulling from real session, run, and delivery signals.",
                "A truthful standup surface should explain what changed, what is blocked, and what needs operator attention next.",
                "The SPA shell can reserve the route now while the backend summary contract is designed properly.",
              ]}
            />
          }
        />
      );
    case "cost-tracker":
      return (
        <DesktopRouteBoundary
          routeKey="budgets"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Budgets"
                description="Credit posture, spend separation, and usage breakdown anchored to the live budget and analytics contracts."
                icon={Wallet}
                iconTone="text-emerald-300 bg-emerald-400/10"
                badge="cost surface"
                stats={[
                  { label: "Scope", value: "Credits + usage" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <BudgetsPageClient />
            </div>
          }
        />
      );
    case "webhooks":
      return (
        <DesktopRouteBoundary
          routeKey="webhooks"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Webhooks"
                description="Manage outbound event endpoints and verify delivery behavior with truthful delivery history."
                icon={Webhook}
                iconTone="text-purple-400 bg-purple-400/10"
                badge="integration surface"
                stats={[
                  { label: "Scope", value: "Event delivery" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <WebhooksPageClient />
            </div>
          }
        />
      );
    case "security":
      return (
        <DesktopRouteBoundary
          routeKey="security"
          browserView={
            <div className="space-y-4">
              <RouteHeader
                title="Security"
                description="Credential inventory, auth posture, and operator trust boundaries in the same surface as deployment and recovery."
                icon={ShieldCheck}
                iconTone="text-amber-300 bg-amber-400/10"
                badge="security surface"
                stats={[
                  { label: "Scope", value: "Auth + keys" },
                  { label: "Data", value: "Live API", tone: "success" },
                ]}
              />

              <SecurityPageClient />
            </div>
          }
        />
      );
    default:
      return null;
  }
}
