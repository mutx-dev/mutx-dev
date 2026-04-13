"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MarketingRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

export function MarketingReveal({
  children,
  className,
  delay = 0,
  distance = 20,
}: MarketingRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = Math.min(distance, 20) * 0.38;
  const blur = Math.min(Math.max(distance / 14, 0.8), 1.8);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0.92,
        y: offset,
        scale: 0.992,
        filter: `blur(${blur}px)`,
      }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
