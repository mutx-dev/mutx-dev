import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  Bot,
  Zap,
  Gauge,
  Layers,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - MUTX",
  description: "View and manage your agents and deployments",
};

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/spawn", label: "Spawn", icon: Zap },
  { href: "/dashboard/control", label: "Control", icon: Gauge },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: Layers },
  { href: "/dashboard/orchestration", label: "Orchestration", icon: Layers },
  { href: "/dashboard/logs", label: "Logs", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-canvas text-text-primary">
      <aside className="fixed left-0 top-0 h-screen w-[272px] shrink-0 border-r border-border-subtle bg-bg-sidebar">
        <div className="flex h-16 items-center border-b border-border-subtle px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-accent/20">
              <span className="font-mono text-sm font-semibold text-signal-accent">M</span>
            </div>
            <span className="font-sans text-lg font-semibold tracking-tight">MUTX</span>
          </Link>
        </div>
        
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 border-t border-border-subtle p-4">
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-accent/20 text-xs font-semibold text-signal-accent">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Admin</p>
              <p className="truncate text-xs text-text-secondary">admin@mutx.dev</p>
            </div>
          </div>
        </div>
      </aside>
      
      <main className="ml-[272px] flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
