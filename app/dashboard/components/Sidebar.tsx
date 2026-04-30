"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Cloud,
  Play,
  FileText,
  Database,
  Wallet,
  Zap,
  Webhook,
  Key,
  Activity,
  Brain
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agent Registry", icon: Bot },
  { href: "/dashboard/deployments", label: "Deployments", icon: Cloud },
  { href: "/dashboard/runs", label: "Run History", icon: Play },
  { href: "/dashboard/reasoning", label: "Reasoning", icon: Brain },
  { href: "/dashboard/traces", label: "Trace Explorer", icon: FileText },
  { href: "/dashboard/memory", label: "Memory Atlas", icon: Database },
  { href: "/dashboard/budgets", label: "Resource Budgets", icon: Wallet },
  { href: "/dashboard/spawn", label: "Agent Spawn", icon: Zap },
  { href: "/dashboard/webhooks", label: "Webhook Gateway", icon: Webhook },
  { href: "/dashboard/api-keys", label: "Key Management", icon: Key },
  { href: "/dashboard/monitoring", label: "System Health", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] border-r border-[rgba(255,255,255,0.06)] bg-[#0a0a0e]/80 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]">
            <Zap className="h-5 w-5 text-black" />
          </div>
          <span className="text-lg font-bold tracking-tight">MUTX</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[rgba(59,130,246,0.12)] text-[#60a5fa]"
                        : "text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-4">
          <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
            <p className="text-xs text-[rgba(255,255,255,0.4)]">
              MUTX dashboard
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
