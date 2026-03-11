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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('terminal-shell relative overflow-hidden rounded-[28px] border border-white/10 bg-[#08111f]/90 shadow-[0_30px_100px_rgba(2,6,23,0.55)]', className)}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            {path ? <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{path}</p> : null}
          </div>
        </div>
        {label ? (
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-200">
            {label}
          </span>
        ) : null}
      </div>
      <div className="relative p-5 font-[family:var(--font-mono)] text-[13px] leading-6 text-slate-200 sm:p-6 sm:text-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_35%)]" />
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  )
}
