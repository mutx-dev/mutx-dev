'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  label: string
  icon: string
  href: string
  description?: string
}

// Fixed: corrected routes to match actual dashboard routes
const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊', href: '/dashboard', description: 'Dashboard overview' },
  { id: 'agents', label: 'Agents', icon: '🤖', href: '/dashboard/agents', description: 'Manage agents' },
  { id: 'deployments', label: 'Deployments', icon: '🚀', href: '/dashboard/deployments', description: 'Deployment management' },
  { id: 'api-keys', label: 'API Keys', icon: '🔑', href: '/dashboard/api-keys', description: 'API key management' },
  { id: 'webhooks', label: 'Webhooks', icon: '🪝', href: '/dashboard/webhooks', description: 'Webhook endpoints' },
  { id: 'logs', label: 'Logs', icon: '📝', href: '/dashboard/logs', description: 'Log viewer' },
  { id: 'docs', label: 'Docs', icon: '📚', href: '/docs', description: 'Documentation' },
]

interface NavItemProps {
  item: MenuItem
  isActive: boolean
}

function NavItem({ item, isActive }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-start space-x-3 px-3 py-3 rounded-lg text-left justify-start group transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <span className="text-lg mt-0.5">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{item.label}</div>
        <div className={cn(
          'text-xs mt-0.5',
          isActive ? 'text-primary/70' : 'text-muted-foreground group-hover:text-foreground/60'
        )}>
          {item.description}
        </div>
      </div>
    </Link>
  )
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className={cn('w-64 bg-card border-r border-border flex flex-col', className)}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-background border border-border/50 flex items-center justify-center">
            <Image
              src="/logo.webp"
              alt="MUTX logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-foreground">MUTX</h2>
            <p className="text-xs text-muted-foreground">Control Plane</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <NavItem item={item} isActive={isActive(item.href)} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-3">
          <div className="text-xs text-muted-foreground">
            MUTX v1.0 — Open Source
          </div>
        </div>
      </div>
    </aside>
  )
}
