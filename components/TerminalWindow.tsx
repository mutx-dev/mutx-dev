'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TerminalWindowProps = {
  title: string
  path?: string
  label?: string
  children: ReactNode
  className?: string
}

export function TerminalWindow({ title, path, label, children, className }: TerminalWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(5,5,5,0.96))] shadow-[0_24px_100px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-white/78">{title}</p>
            {path ? <p className="mt-1 truncate text-[11px] text-white/35">{path}</p> : null}
          </div>
        </div>
        {label ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
            {label}
          </span>
        ) : null}
      </div>
      <div className="relative h-[calc(100%-61px)] p-4 font-mono text-[13px] leading-6 text-slate-300 sm:p-5 sm:text-sm">{children}</div>
    </motion.div>
  )
}
