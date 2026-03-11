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
      className={cn('relative overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] shadow-2xl', className)}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80">{title}</p>
          </div>
        </div>
        {label ? (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
            {label}
          </span>
        ) : null}
      </div>
      <div className="relative p-4 font-mono text-[13px] leading-6 text-slate-300 sm:p-5 sm:text-sm">
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  )
}
