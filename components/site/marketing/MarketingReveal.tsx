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

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0.92,
        y: Math.min(distance, 20) * 0.38,
        scale: 0.992,
        filter: "blur(2px)",
      }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
