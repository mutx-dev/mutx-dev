'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TerminalWindow } from './TerminalWindow'

type Step = {
  type: 'command' | 'output' | 'wait' | 'clear'
  content: string
  delay?: number
}

const steps: Step[] = [
  { type: 'command', content: 'mutx login' },
  { type: 'output', content: 'Authenticated as operator' },
  { type: 'wait', content: '', delay: 600 },
  
  { type: 'command', content: 'mutx agents deploy --name "recon-swarm"' },
  { type: 'wait', content: '', delay: 500 },
  { type: 'output', content: 'Provisioning isolated runtime environment...' },
  { type: 'wait', content: '', delay: 800 },
  { type: 'output', content: 'Attaching persistent state volume...' },
  { type: 'output', content: 'Agent deployed successfully! ID: 7f5e4e3b' },
  { type: 'wait', content: '', delay: 1200 },
  
  { type: 'command', content: 'mutx logs 7f5e4e3b --follow' },
  { type: 'wait', content: '', delay: 400 },
  { type: 'output', content: '[recon-swarm] Initializing autonomous loop...' },
  { type: 'wait', content: '', delay: 500 },
  { type: 'output', content: '[recon-swarm] Received webhook event: "market_update"' },
  { type: 'output', content: '[recon-swarm] Executing tool: "fetch_data"' },
  { type: 'wait', content: '', delay: 1000 },
  { type: 'output', content: '[recon-swarm] Analysis complete. Storing state.' },
  { type: 'wait', content: '', delay: 3000 },
  { type: 'clear', content: '' },
]

export function AnimatedTerminal() {
  const [visibleSteps, setVisibleSteps] = useState<number>(0)
  const [typing, setTyping] = useState('')

  useEffect(() => {
    let currentStep = 0
    let isCancelled = false

    const runSequence = async () => {
      while (!isCancelled) {
        if (currentStep >= steps.length) {
          // loop back
          currentStep = 0
          setVisibleSteps(0)
          await new Promise(r => setTimeout(r, 1000))
          continue
        }

        const step = steps[currentStep]
        
        if (step.type === 'clear') {
          setVisibleSteps(0)
          currentStep++
          continue
        }

        if (step.type === 'wait') {
          await new Promise(r => setTimeout(r, step.delay || 500))
          if (isCancelled) break
          currentStep++
          setVisibleSteps(currentStep)
          continue
        }

        if (step.type === 'command') {
          for (let i = 0; i <= step.content.length; i++) {
            if (isCancelled) break
            setTyping(step.content.slice(0, i))
            await new Promise(r => setTimeout(r, 30 + Math.random() * 40)) // natural typing
          }
          if (isCancelled) break
          setTyping('')
        } else {
          await new Promise(r => setTimeout(r, 50))
        }

        currentStep++
        setVisibleSteps(currentStep)
      }
    }

    runSequence()

    return () => { isCancelled = true }
  }, [])

  return (
    <TerminalWindow title="mutx-cli" path="~/mutx-dev" label="live demo" className="h-[380px]">
      <div className="space-y-2.5">
        {steps.slice(0, visibleSteps).map((step, i) => {
          if (step.type === 'wait' || step.type === 'clear') return null
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              className="terminal-line"
            >
              {step.type === 'command' ? (
                <>
                  <span className="terminal-prompt text-cyan-400">$</span>
                  <span className="text-white">{step.content}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-500">›</span>
                  <span className="text-slate-300">{step.content}</span>
                </>
              )}
            </motion.div>
          )
        })}
        {typing && (
          <div className="terminal-line">
            <span className="terminal-prompt text-cyan-400">$</span>
            <span className="text-white">{typing}</span>
            <motion.span 
              animate={{ opacity: [1, 0] }} 
              transition={{ repeat: Infinity, duration: 0.8 }} 
              className="terminal-caret text-cyan-300 ml-1"
            >
              |
            </motion.span>
          </div>
        )}
        {!typing && (
          <div className="terminal-line">
            <span className="terminal-prompt text-cyan-400">$</span>
            <span className="text-white"></span>
            <motion.span 
              animate={{ opacity: [1, 0] }} 
              transition={{ repeat: Infinity, duration: 0.8 }} 
              className="terminal-caret text-cyan-300 ml-1"
            >
              |
            </motion.span>
          </div>
        )}
      </div>
    </TerminalWindow>
  )
}
