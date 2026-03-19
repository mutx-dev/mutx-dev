'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  priority?: boolean // shown in mobile bottom bar
}

interface NavGroup {
  id: string
  label?: string
  items: NavItem[]
}

// ─── Nav Structure ───────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    id: 'core',
    items: [
      { id: 'overview', label: 'Overview', href: '/dashboard', icon: <OverviewIcon />, priority: true },
      { id: 'agents', label: 'Agents', href: '/dashboard/agents', icon: <AgentsIcon />, priority: true },
      { id: 'deployments', label: 'Deployments', href: '/dashboard/deployments', icon: <DeployIcon />, priority: true },
      { id: 'webhooks', label: 'Webhooks', href: '/dashboard/webhooks', icon: <WebhookIcon />, priority: false },
      { id: 'api-keys', label: 'API Keys', href: '/dashboard/api-keys', icon: <KeyIcon />, priority: false },
    ],
  },
  {
    id: 'observe',
    label: 'OBSERVE',
    items: [
      { id: 'history', label: 'History', href: '/dashboard/history', icon: <ActivityIcon />, priority: true },
      { id: 'logs', label: 'Logs', href: '/dashboard/logs', icon: <LogsIcon />, priority: false },
    ],
  },
  {
    id: 'automate',
    label: 'AUTOMATE',
    items: [
      { id: 'orchestration', label: 'Orchestration', href: '/dashboard/orchestration', icon: <CronIcon />, priority: false },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      { id: 'control', label: 'Control', href: '/dashboard/control', icon: <SettingsIcon />, priority: false },
    ],
  },
]

// Flatten all nav items for mobile priority bar
function flattenItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap(g => g.items)
}

// ─── NavButton (desktop + mobile sheet) ───────────────────────────────────────

function NavButton({
  item,
  active,
  expanded,
  nested = false,
}: {
  item: NavItem
  active: boolean
  expanded: boolean
  nested?: boolean
}) {
  const iconSize = nested ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = nested ? 'text-xs' : 'text-sm'

  if (!expanded) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-lg transition-colors group relative',
          active
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <div className={iconSize}>{item.icon}</div>
        {active && (
          <span className="absolute left-0 w-0.5 h-5 bg-primary rounded-r" />
        )}
        <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'w-full flex items-center gap-2 px-2 rounded-lg text-left justify-start relative',
        nested ? 'py-1' : 'py-1.5',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      {active && (
        <span className="absolute left-0 w-0.5 h-5 bg-primary rounded-r" />
      )}
      <div className={cn(iconSize, 'shrink-0')}>{item.icon}</div>
      <span className={cn(textSize, 'truncate')}>{item.label}</span>
    </Link>
  )
}

// ─── Sidebar (desktop) ────────────────────────────────────────────────────────

interface SidebarDesktopProps {
  expanded: boolean
  onToggle: () => void
}

function SidebarDesktop({ expanded, onToggle }: SidebarDesktopProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'hidden md:flex flex-col bg-gradient-to-b from-card to-background border-r border-border shrink-0 transition-all duration-200 ease-in-out',
        expanded ? 'w-[220px]' : 'w-14'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center shrink-0', expanded ? 'px-3 py-3 gap-2.5' : 'flex-col py-3 gap-2')}>
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-background border border-border/50 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
            <rect width="32" height="32" rx="8" fill="url(#grad)" />
            <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="22" r="3" fill="white" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {expanded && (
          <div className="flex items-baseline gap-2 truncate flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">MUTX</span>
            <span className="text-2xs text-muted-foreground font-mono-tight shrink-0">v1.0</span>
          </div>
        )}
        <button
          onClick={onToggle}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            {expanded ? (
              <polyline points="10,3 5,8 10,13" />
            ) : (
              <polyline points="6,3 11,8 6,13" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {navGroups.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 && (
              <div className={cn('my-1.5 border-t border-border', expanded ? 'mx-3' : 'mx-2')} />
            )}

            {expanded && group.label && (
              <div className="px-3 mt-3 mb-1">
                <span className="text-[10px] tracking-wider text-muted-foreground/60 font-semibold select-none uppercase">
                  {group.label}
                </span>
              </div>
            )}

            <div className={cn('flex flex-col', expanded ? 'gap-0.5 px-2' : 'items-center gap-1 py-0.5')}>
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={isActive(item.href)}
                  expanded={expanded}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="px-3 pb-3 shrink-0">
          <div className="rounded-lg border border-border/50 bg-secondary/50 p-2">
            <div className="text-[10px] text-muted-foreground/70">MUTX Control Plane</div>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Mobile Bottom Bar ────────────────────────────────────────────────────────

interface MobileBottomBarProps {
  activeHref: string
}

function MobileBottomBar({ activeHref }: MobileBottomBarProps) {
  const allItems = flattenItems(navGroups)
  const priorityItems = allItems.filter(i => i.priority)
  const nonPriorityIds = new Set(allItems.filter(i => !i.priority).map(i => i.id))
  const [sheetOpen, setSheetOpen] = useState(false)

  function isActive(item: NavItem): boolean {
    return item.href === '/dashboard'
      ? activeHref === '/dashboard' || activeHref === '/dashboard/'
      : activeHref.startsWith(item.href)
  }

  const moreActive = nonPriorityIds.has(
    navGroups.flatMap(g => g.items).find(i => activeHref.startsWith(i.href))?.id ?? ''
  )

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-1 h-14">
          {priorityItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg min-w-[48px] min-h-[48px]',
                isActive(item) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="w-5 h-5">{item.icon}</div>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg min-w-[48px] min-h-[48px] relative',
              moreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="w-5 h-5">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="8" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="12" cy="8" r="1.5" />
              </svg>
            </div>
            <span className="text-[10px] font-medium">More</span>
            {moreActive && (
              <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>

      <MobileBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} activeHref={activeHref} />
    </>
  )
}

// ─── Mobile Bottom Sheet ──────────────────────────────────────────────────────

function MobileBottomSheet({
  open,
  onClose,
  activeHref,
}: {
  open: boolean
  onClose: () => void
  activeHref: string
}) {
  const [visible, setVisible] = useState(false)

  function isActive(item: NavItem): boolean {
    return item.href === '/dashboard'
      ? activeHref === '/dashboard' || activeHref === '/dashboard/'
      : activeHref.startsWith(item.href)
  }

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <div className="md:hidden fixed inset-0 z-[60]">
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-card rounded-t-lg max-h-[70vh] overflow-y-auto safe-area-bottom transition-transform duration-200 ease-out',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="px-4 pb-6">
          {navGroups.map((group, groupIndex) => (
            <div key={group.id}>
              {groupIndex > 0 && <div className="my-3 border-t border-border" />}
              {group.label && (
                <div className="px-1 pt-1 pb-2">
                  <span className="text-[10px] tracking-wider text-muted-foreground/60 font-semibold uppercase">
                    {group.label}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 min-h-[48px] h-auto rounded-lg justify-start transition-colors',
                      isActive(item)
                        ? 'bg-primary/15 text-primary'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    <div className="w-5 h-5 shrink-0">{item.icon}</div>
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Root NavRail ────────────────────────────────────────────────────────────

export function NavRail() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      <SidebarDesktop expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      <MobileBottomBar activeHref={pathname} />
    </>
  )
}

// ─── Icons (16x16 stroke-based) ─────────────────────────────────────────────

export function OverviewIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

export function AgentsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

export function DeployIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L2 7l8 5 8-5-8-5z" />
      <path d="M2 12l8 5 8-5" />
      <path d="M2 17l8 5 8-5" />
    </svg>
  )
}

export function ActivityIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,8 4,8 6,3 8,13 10,6 12,8 15,8" />
    </svg>
  )
}

export function LogsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M5 5h6M5 8h6M5 11h3" />
    </svg>
  )
}

export function CronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4v4l2.5 2.5" />
    </svg>
  )
}

export function WebhookIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2.5" />
      <circle cx="11" cy="5" r="2.5" />
      <circle cx="8" cy="12" r="2.5" />
      <path d="M5 7.5v1c0 1.1.4 2 1.2 2.7" />
      <path d="M11 7.5v1c0 1.1-.4 2-1.2 2.7" />
    </svg>
  )
}

export function KeyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3.5" />
      <path d="M8 8l6 6" />
      <path d="M11 14l2-2" />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" />
    </svg>
  )
}
