'use client'

// useState import removed - unused
import { cn } from '@/lib/utils'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

export interface DashboardWidget {
  id: string
  label: string
  size?: WidgetSize
}

export interface WidgetGridProps {
  widgets: DashboardWidget[]
  children: React.ReactNode
  className?: string
  onWidgetRemove?: (id: string) => void
  customizing?: boolean
}

export function WidgetGrid({ children, className }: WidgetGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </div>
  )
}

export function WidgetGridItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      {children}
    </div>
  )
}
