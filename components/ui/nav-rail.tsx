"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, ArrowRight, Bot, Command, Github, HeartPulse, KeyRound, Menu, Rocket, ShieldCheck, X } from "lucide-react"
import { useMemo, useState } from "react"

interface NavItem {
  label: string
  hint: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  priority?: boolean
}

const navItems: NavItem[] = [
  { label: "Overview", hint: "session + fleet posture", href: "/app", icon: ShieldCheck, priority: true },
  { label: "Agents", hint: "live inventory", href: "/app/agents", icon: Bot, priority: true },
  { label: "Deployments", hint: "timeline + recovery", href: "/app/deployments", icon: Rocket, priority: true },
  { label: "API Keys", hint: "generate / rotate / revoke", href: "/app/api-keys", icon: KeyRound, priority: true },
  { label: "Health", hint: "proxy reachability", href: "/app/health", icon: HeartPulse },
  { label: "Webhooks", hint: "event subscriptions", href: "/app/webhooks", icon: Activity },
  { label: "Observability", hint: "logs + metrics + state", href: "/app/observability", icon: Activity },
]

function isItemActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app" || pathname === "/app/"
  return pathname.startsWith(href)
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 transition-colors flex items-center gap-3 ${
        active
          ? "border-cyan-400/20 bg-cyan-400/10 text-white"
          : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-300"
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <div>
        <p>{item.label}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{item.hint}</p>
      </div>
    </Link>
  )
}

function MobileBottomBar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const priorityItems = useMemo(() => navItems.filter((item) => item.priority), [])
  const moreActive = navItems.some((item) => !item.priority && isItemActive(pathname, item.href))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030307]/95 backdrop-blur-lg lg:hidden">
        <div className="flex items-center justify-around px-1 h-14">
          {priorityItems.map((item) => {
            const active = isItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 ${
                  active ? "text-cyan-300" : "text-slate-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 ${
              moreActive ? "text-cyan-300" : "text-slate-400"
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
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
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2 text-sm font-medium text-slate-400">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} active={isItemActive(pathname, item.href)} onClick={() => setOpen(false)} />
              ))}
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
      ) : null}
    </>
  )
}

export function NavRail() {
  const pathname = usePathname()

  return (
    <>
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
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isItemActive(pathname, item.href)} />
          ))}
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

      <MobileBottomBar pathname={pathname} />
    </>
  )
}
