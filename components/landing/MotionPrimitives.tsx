'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type MotionInProps = {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
}

export function MotionIn({ children, className, delay = 0, distance = 24 }: MotionInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

type FloatLayerProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function FloatLayer({ children, className, delay = 0 }: FloatLayerProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 6.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

type TraceSweepProps = {
  className?: string
  delay?: number
}

export function TraceSweep({ className, delay = 0 }: TraceSweepProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return null
  }

  return (
    <motion.div
      className={className}
      initial={{ x: '-120%', opacity: 0 }}
      animate={{ x: ['-120%', '120%'], opacity: [0, 0.6, 0] }}
      transition={{ duration: 2.8, delay, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }}
    />
  )
}
