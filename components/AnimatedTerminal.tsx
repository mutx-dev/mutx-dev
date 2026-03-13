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
  { type: 'command', content: 'mutx login --email operator@team.dev' },
  { type: 'output', content: 'Authenticated. Session stored in ~/.mutx/config.json', tone: 'success' },
  { type: 'wait', delay: 550 },
  { type: 'divider' },
  { type: 'command', content: 'mutx agents list --limit 3' },
  { type: 'output', content: 'agt_01  running   ownership-sync', tone: 'default' },
  { type: 'output', content: 'agt_02  degraded  webhook-router', tone: 'accent' },
  { type: 'output', content: 'agt_03  running   sdk-parity-check', tone: 'default' },
  { type: 'wait', delay: 700 },
  { type: 'divider' },
  { type: 'command', content: 'mutx agents deploy agt_02' },
  { type: 'output', content: 'Deployment queued: dep_7842', tone: 'success' },
  { type: 'output', content: 'replicas=1  strategy=rolling  source=agent-record', tone: 'muted' },
  { type: 'wait', delay: 650 },
  { type: 'command', content: 'mutx deploy events dep_7842' },
  { type: 'output', content: 'created  -> provisioning runtime', tone: 'muted' },
  { type: 'output', content: 'running  -> health checks passing', tone: 'success' },
  { type: 'wait', delay: 650 },
  { type: 'divider' },
  { type: 'command', content: 'curl -s https://mutx.dev/health && curl -s https://mutx.dev/ready' },
  { type: 'output', content: '{"status":"ok"}', tone: 'success' },
  { type: 'output', content: '{"status":"ready"}', tone: 'success' },
  { type: 'wait', delay: 700 },
  { type: 'divider' },
  { type: 'command', content: 'curl -X POST https://mutx.dev/webhooks/incoming/github' },
  { type: 'output', content: '202 accepted  event routed for processing', tone: 'accent' },
  { type: 'wait', delay: 2200 },
  { type: 'clear' },
]

const toneClass: Record<string, string> = {
  default: 'text-slate-200',
  success: 'text-emerald-300',
  muted: 'text-slate-500',
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
            await new Promise((resolve) => setTimeout(resolve, 14 + Math.random() * 24))
          }
          setTyping('')
        } else {
          await new Promise((resolve) => setTimeout(resolve, 60))
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
    <TerminalWindow title="mutx operator cli" path="~/mutx" label="live control surface" className="h-[420px] sm:h-[460px] lg:h-[500px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <div className="mb-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200/90">auth</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">agents</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">deployments</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">health</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200/90">webhooks</span>
        </div>

        <div className="terminal-grid flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 sm:p-5">
          <div className="space-y-2.5">
            {renderedSteps.map((step, index) => {
              if (step.type === 'wait' || step.type === 'clear') return null
              if (step.type === 'divider') {
                return <div key={`divider-${index}`} className="my-2 border-t border-white/10" />
              }

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
