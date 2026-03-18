'use client'

import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

interface WidgetGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
  customizing?: boolean
  onCustomize?: () => void
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

export function WidgetGrid({
  children,
  className,
  cols = 12,
  gap = 'md',
  customizing = false,
  onCustomize,
}: WidgetGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Widget rows are rendered by children using Tailwind xl:grid-cols-12 */}
      <div className={cn(gapClasses[gap])}>{children}</div>
    </div>
  )
}

// Size → xl:col-span mapping
const SIZE_SPANS: Record<WidgetSize, string> = {
  sm: 'xl:col-span-6',
  md: 'xl:col-span-4',
  lg: 'xl:col-span-8',
  full: 'xl:col-span-12',
}

interface WidgetCardProps {
  id: string
  title?: string
  size?: WidgetSize
  children: React.ReactNode
  className?: string
  customizing?: boolean
  onRemove?: (id: string) => void
  actions?: React.ReactNode
}

export function WidgetCard({
  id,
  title,
  size = 'md',
  children,
  className,
  customizing = false,
  onRemove,
  actions,
}: WidgetCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden',
        SIZE_SPANS[size],
        customizing && 'ring-2 ring-slate-700 ring-dashed',
        className
      )}
    >
      {customizing && onRemove && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="text-xs text-rose-400 hover:text-rose-300 bg-slate-900/80 backdrop-blur-sm rounded px-1.5 py-0.5 border border-rose-500/30"
          >
            ×
          </button>
        </div>
      )}

      {title && (
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>
  )
}

// Drag-and-drop reordering for widget grids
interface DraggableWidgetGridProps {
  layout: string[]
  onLayoutChange: (layout: string[]) => void
  availableWidgets: { id: string; label: string; description?: string; size?: WidgetSize }[]
  renderWidget: (id: string) => React.ReactNode
  className?: string
}

export function DraggableWidgetGrid({
  layout,
  onLayoutChange,
  availableWidgets,
  renderWidget,
  className,
}: DraggableWidgetGridProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const hiddenWidgets = availableWidgets.filter((w) => !layout.includes(w.id))

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDragId(widgetId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', widgetId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (_e: React.DragEvent, widgetId: string) => {
    dragCounter.current++
    setDragOverId(widgetId)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current <= 0) {
      setDragOverId(null)
      dragCounter.current = 0
    }
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOverId(null)
    setDragId(null)

    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) return

    const nextLayout = [...layout]
    const sourceIdx = nextLayout.indexOf(sourceId)
    const targetIdx = nextLayout.indexOf(targetId)

    if (sourceIdx === -1) {
      if (targetIdx === -1) return
      nextLayout.splice(targetIdx + 1, 0, sourceId)
    } else if (targetIdx === -1) {
      return
    } else {
      nextLayout.splice(sourceIdx, 1)
      nextLayout.splice(targetIdx, 0, sourceId)
    }

    onLayoutChange(nextLayout)
  }

  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
    dragCounter.current = 0
  }

  const addWidget = (widgetId: string) => {
    if (layout.includes(widgetId)) return
    onLayoutChange([...layout, widgetId])
  }

  const removeWidget = (widgetId: string) => {
    onLayoutChange(layout.filter((id) => id !== widgetId))
  }

  // Group widgets into rows: full-width get their own row, others flow in 12-col grid
  const renderWidgets = () => {
    const elements: React.ReactNode[] = []
    let rowWidgets: { id: string; size: WidgetSize }[] = []
    let rowSpan = 0

    const flushRow = () => {
      if (rowWidgets.length === 0) return
      elements.push(
        <div key={`row-${elements.length}`} className="grid xl:grid-cols-12 gap-4">
          {rowWidgets.map(({ id, size }) => (
            <div key={id} className={cn(SIZE_SPANS[size], 'relative')}>
              {renderWidget(id)}
            </div>
          ))}
        </div>
      )
      rowWidgets = []
      rowSpan = 0
    }

    for (const widgetId of layout) {
      const widget = availableWidgets.find((w) => w.id === widgetId)
      const size = widget?.size ?? 'md'

      if (size === 'full') {
        flushRow()
        elements.push(
          <div key={widgetId} className="xl:col-span-12">
            {renderWidget(widgetId)}
          </div>
        )
      } else {
        const span = size === 'sm' ? 6 : size === 'lg' ? 8 : 4
        if (rowSpan + span > 12) flushRow()
        rowWidgets.push({ id: widgetId, size })
        rowSpan += span
      }
    }
    flushRow()

    return elements
  }

  return (
    <div className={cn('space-y-4', className)}>
      {renderWidgets()}

      {/* Available widgets */}
      {hiddenWidgets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available Widgets</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {hiddenWidgets.map((widget) => (
              <button
                key={widget.id}
                type="button"
                onClick={() => addWidget(widget.id)}
                className="rounded-lg border border-dashed border-slate-700 p-3 text-left hover:border-slate-500 hover:bg-slate-800/30 transition-colors"
              >
                <div className="text-xs font-medium text-slate-300">{widget.label}</div>
                {widget.description && (
                  <div className="text-2xs text-slate-500 mt-0.5">{widget.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
