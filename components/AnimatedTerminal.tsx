'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import { TerminalWindow } from './TerminalWindow'

type Step =
  | { type: 'command'; content: string }
  | { type: 'output'; content: string; tone?: 'default' | 'success' | 'muted' | 'accent' }
  | { type: 'wait'; delay: number }
  | { type: 'divider' }
  | { type: 'clear' }

const steps: Step[] = [
  { type: 'command', content: 'mutx login' },
  { type: 'output', content: 'session ready', tone: 'success' },
  { type: 'wait', delay: 400 },
  { type: 'divider' },
  { type: 'command', content: 'mutx deployments list' },
  { type: 'output', content: 'api-gateway        healthy', tone: 'success' },
  { type: 'output', content: 'webhook-router     healthy', tone: 'success' },
  { type: 'output', content: 'agent-runtime      degraded', tone: 'accent' },
  { type: 'wait', delay: 600 },
  { type: 'divider' },
  { type: 'command', content: 'mutx deployments restart agent-runtime' },
  { type: 'output', content: 'restart queued', tone: 'muted' },
  { type: 'wait', delay: 500 },
  { type: 'command', content: 'mutx health' },
  { type: 'output', content: 'status: healthy', tone: 'success' },
  { type: 'output', content: 'ready: true', tone: 'success' },
  { type: 'wait', delay: 1400 },
  { type: 'clear' },
]

const toneClass: Record<string, string> = {
  default: 'text-zinc-200',
  success: 'text-emerald-300',
  muted: 'text-zinc-500',
  accent: 'text-cyan-300',
}

export function AnimatedTerminal() {
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [typing, setTyping] = useState('')

  const renderedSteps = useMemo(() => steps.slice(0, visibleSteps), [visibleSteps])

  useEffect(() => {
    let currentStep = 0
    let cancelled = false

    const run = async () => {
      while (!cancelled) {
        if (currentStep >= steps.length) {
          currentStep = 0
          setVisibleSteps(0)
          await new Promise((resolve) => setTimeout(resolve, 900))
          continue
        }

        const step = steps[currentStep]

        if (step.type === 'clear') {
          setVisibleSteps(0)
          currentStep += 1
          continue
        }

        if (step.type === 'wait') {
          await new Promise((resolve) => setTimeout(resolve, step.delay))
          if (cancelled) break
          currentStep += 1
          continue
        }

        if (step.type === 'command') {
          for (let i = 0; i <= step.content.length; i += 1) {
            if (cancelled) break
            setTyping(step.content.slice(0, i))
            await new Promise((resolve) => setTimeout(resolve, 16 + Math.random() * 16))
          }
          setTyping('')
        } else {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        currentStep += 1
        setVisibleSteps(currentStep)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <TerminalWindow title="mutx" path="~/control" label="live operator view" className="h-[360px] sm:h-[400px] lg:h-[440px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <div className="mb-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.24em] text-white/38">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">auth</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">deployments</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">health</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200/85">recovery</span>
        </div>

        <div className="terminal-grid flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 sm:p-5">
          <div className="space-y-2.5">
            {renderedSteps.map((step, index) => {
              if (step.type === 'wait' || step.type === 'clear') return null
              if (step.type === 'divider') return <div key={`divider-${index}`} className="my-2 border-t border-white/10" />

              if (step.type === 'command') {
                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="terminal-line">
                    <span className="terminal-prompt text-cyan-300">$</span>
                    <span className="text-white">{step.content}</span>
                  </motion.div>
                )
              }

              return (
                <motion.div key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="terminal-line pl-5">
                  <span className="text-white/18">↳</span>
                  <span className={toneClass[step.tone || 'default']}>{step.content}</span>
                </motion.div>
              )
            })}

            {typing ? (
              <div className="terminal-line">
                <span className="terminal-prompt text-cyan-300">$</span>
                <span className="text-white">{typing}</span>
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="terminal-caret ml-1 text-cyan-200">
                  |
                </motion.span>
              </div>
            ) : (
              <div className="terminal-line opacity-70">
                <span className="terminal-prompt text-cyan-300">$</span>
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="terminal-caret ml-1 text-cyan-200">
                  |
                </motion.span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TerminalWindow>
  )
}
