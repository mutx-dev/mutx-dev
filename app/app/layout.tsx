"use client";

import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bot, Command, Github, KeyRound, LogOut, Rocket, 
  ShieldCheck, Activity, Menu, X, ArrowRight, LogOut as SignOutIcon
} from 'lucide-react';
import { TerminalWindow } from '@/components/TerminalWindow';

function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { label: 'Overview', hint: 'session + fleet posture', href: '/app', icon: ShieldCheck },
  { label: 'Agents', hint: 'live inventory', href: '/app/agents', icon: Bot },
  { label: 'Deployments', hint: 'timeline + recovery', href: '/app/deployments', icon: Rocket },
  { label: 'API Keys', hint: 'generate / rotate / revoke', href: '/app/api-keys', icon: KeyRound },
  { label: 'Health', hint: 'proxy reachability', href: '/app/health', icon: LogOut },
  { label: 'Webhooks', hint: 'event subscriptions', href: '/app/webhooks', icon: Activity },
  { label: 'Observability', hint: 'logs + metrics + state', href: '/app/observability', icon: Activity },
]

function MobileNav({ isOpen, onClose, currentItem }: { isOpen: boolean; onClose: () => void; currentItem: { href: string } }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#030307] border-r border-white/10 p-5 animate-in slide-in-from-left">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
              <Command className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">app.mutx.dev</p>
              <p className="text-sm font-semibold text-white">Mission Control</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-2 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = currentItem.href === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`rounded-xl border px-3 py-2 transition-colors flex items-center gap-3 ${
                  isActive
                    ? 'border-cyan-400/20 bg-cyan-400/10 text-white'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-300'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <div>
                  <p>{item.label}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{item.hint}</p>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-3 text-sm">
          <a href="https://github.com/fortunexbt/mutx-dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 transition hover:bg-white/[0.02] hover:text-white">
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a href="https://mutx.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-cyan-400 transition hover:bg-cyan-400/10">
            <ArrowRight className="h-4 w-4" />
            Marketing site
          </a>
        </div>
      </aside>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const currentItem = navItems.find(item => {
    if (item.href === '/app') {
      return pathname === '/app' || pathname === '/app/';
    }
    return pathname.startsWith(item.href);
  }) || navItems[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030307] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentItem={currentItem} />

      <div className="relative mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:hidden mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
              <Command className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">app.mutx.dev</p>
              <p className="text-sm font-semibold text-white">Mission Control</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="panel sticky top-4 hidden h-fit rounded-[24px] border border-white/5 bg-white/[0.01] p-5 backdrop-blur-xl lg:min-h-[calc(100vh-2rem)] lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">app.mutx.dev</p>
                <p className="text-sm font-semibold text-white">Mission Control</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300/70">demo-ready operator surface</p>
              </div>
            </div>

            <nav className="space-y-2 text-sm font-medium text-slate-400">
              {navItems.map((item) => {
                const isActive = currentItem.href === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`rounded-xl border px-3 py-2 transition-colors flex items-center gap-3 ${
                      isActive
                        ? 'border-cyan-400/20 bg-cyan-400/10 text-white'
                        : 'border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-300'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <div>
                      <p>{item.label}</p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{item.hint}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-5 left-5 right-5 space-y-3 text-sm">
              <a href="https://github.com/fortunexbt/mutx-dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 transition hover:bg-white/[0.02] hover:text-white">
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a href="https://mutx.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-cyan-400 transition hover:bg-cyan-400/10">
                <ArrowRight className="h-4 w-4" />
                Marketing site
              </a>
            </div>
          </aside>

          <main className="space-y-6 pb-10">
            <Suspense fallback={<PageLoadingSkeleton />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
