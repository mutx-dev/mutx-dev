'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  { type: 'wait', delay: 350 },
  { type: 'divider' },
  { type: 'command', content: 'mutx deployments list' },
  { type: 'output', content: 'api-gateway        healthy', tone: 'success' },
  { type: 'output', content: 'webhook-router     healthy', tone: 'success' },
  { type: 'output', content: 'agent-runtime      degraded', tone: 'accent' },
  { type: 'wait', delay: 500 },
  { type: 'divider' },
  { type: 'command', content: 'mutx deployments restart agent-runtime' },
  { type: 'output', content: 'restart queued', tone: 'muted' },
  { type: 'wait', delay: 400 },
  { type: 'command', content: 'mutx health' },
  { type: 'output', content: 'status: healthy', tone: 'success' },
  { type: 'output', content: 'ready: true', tone: 'success' },
  { type: 'wait', delay: 1200 },
  { type: 'clear' },
]

const toneClass: Record<string, string> = {
  default: 'text-zinc-100',
  success: 'text-emerald-300',
  muted: 'text-zinc-400',
  accent: 'text-cyan-300',
}

export function AnimatedTerminal() {
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [typing, setTyping] = useState('')

  const renderedSteps = useMemo(() => steps.slice(0, visibleSteps), [visibleSteps])

  useEffect(() => {
    let currentStep = 0

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
            await new Promise((resolve) => setTimeout(resolve, 12 + Math.random() * 10))
          }
          setTyping('')
        } else {
          await new Promise((resolve) => setTimeout(resolve, 40))
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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [renderedSteps, typing])

  return (
    <TerminalWindow
      title="mutx"
      path="~/control"
      label="live operator view"
      className="h-[320px] sm:h-[360px] lg:h-[420px] xl:h-[460px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-white/45 sm:mb-4 sm:text-[11px]">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">auth</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">deployments</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">health</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200/90">recovery</span>
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/65 p-3 sm:p-4 lg:p-5">
          <div
            ref={containerRef}
            className="h-full overflow-y-auto pr-1 font-mono text-[12px] leading-6 sm:text-[13px] sm:leading-6 lg:text-[14px] lg:leading-7"
          >
            <div className="space-y-2">
              {renderedSteps.map((step, index) => {
                if (step.type === 'wait' || step.type === 'clear') return null
                if (step.type === 'divider') return <div key={`divider-${index}`} className="my-2 border-t border-white/10" />

                if (step.type === 'command') {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 break-all text-white"
                    >
                      <span className="shrink-0 text-cyan-300">$</span>
                      <span className="min-w-0">{step.content}</span>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 pl-4 sm:pl-5"
                  >
                    <span className="shrink-0 text-white/25">↳</span>
                    <span className={`${toneClass[step.tone || 'default']} min-w-0 break-all`}>{step.content}</span>
                  </motion.div>
                )
              })}

              {typing ? (
                <div className="flex items-start gap-2 break-all text-white">
                  <span className="shrink-0 text-cyan-300">$</span>
                  <span className="min-w-0">{typing}</span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="text-cyan-200"
                  >
                    |
                  </motion.span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-white/70">
                  <span className="shrink-0 text-cyan-300">$</span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="text-cyan-200"
                  >
                    |
                  </motion.span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </TerminalWindow>
  )
}
