"use client";

import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

type HeroMonitorShowcaseProps = {
  className?: string;
};

export function HeroMonitorShowcase({ className }: HeroMonitorShowcaseProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [allowPointerTilt, setAllowPointerTilt] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, {
    stiffness: 160,
    damping: 22,
    mass: 0.75,
  });
  const springRotateY = useSpring(rotateY, {
    stiffness: 160,
    damping: 22,
    mass: 0.75,
  });

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start end", "end start"],
  });

  const floatY = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -24]);
  const chromeShiftX = useTransform(springRotateY, [-10, 10], [-14, 14]);
  const chromeShiftY = useTransform(springRotateX, [-10, 10], [10, -10]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAllowPointerTilt(false);
      return;
    }

    const media = window.matchMedia("(pointer: fine)");
    const update = () => setAllowPointerTilt(media.matches);

    update();

    const addListener = media.addEventListener?.bind(media);
    const removeListener = media.removeEventListener?.bind(media);

    if (addListener && removeListener) {
      addListener("change", update);
      return () => removeListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [prefersReducedMotion]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!allowPointerTilt || !rootRef.current) {
      return;
    }

    const rect = rootRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;

    rotateY.set(relativeX * 12);
    rotateX.set(relativeY * -10);
  }

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      ref={rootRef}
      data-hero-monitor-root
      className={cn("relative mx-auto w-full max-w-[58rem]", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[12%] top-[7%] h-36 rounded-full bg-cyan-400/18 blur-[120px] sm:h-48"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[6%] top-[18%] h-40 w-40 rounded-full bg-sky-300/10 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] top-[20%] h-52 w-52 rounded-full bg-cyan-400/8 blur-[110px]"
      />

      <motion.div
        style={prefersReducedMotion ? undefined : { y: floatY }}
        className="relative"
      >
        <motion.div
          data-hero-monitor-shell
          style={
            prefersReducedMotion
              ? undefined
              : {
                  transformPerspective: 2200,
                  rotateX: springRotateX,
                  rotateY: springRotateY,
                }
          }
          className="relative mx-auto w-full will-change-transform md:[transform-style:preserve-3d]"
        >
          <motion.div
            aria-hidden="true"
            style={prefersReducedMotion ? undefined : { x: chromeShiftX, y: chromeShiftY }}
            className="pointer-events-none absolute inset-[6%] rounded-[2.6rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_42%),linear-gradient(120deg,rgba(255,255,255,0.1),transparent_38%)] opacity-60 mix-blend-screen"
          />

          <div className="relative rounded-[2.8rem] border border-white/20 bg-[linear-gradient(180deg,rgba(225,232,240,0.98)_0%,rgba(160,173,186,0.98)_38%,rgba(102,116,132,0.98)_100%)] p-[10px] shadow-[0_48px_120px_rgba(2,6,23,0.52)] sm:p-3">
            <div className="relative overflow-hidden rounded-[2.25rem] border border-black/35 bg-[linear-gradient(180deg,#131a23_0%,#050a11_100%)] px-3 pb-3 pt-6 sm:px-4 sm:pb-4 sm:pt-7">
              <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-black/80 shadow-[0_0_0_2px_rgba(255,255,255,0.06)]" />

              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#04101a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <Image
                  src="/demo-poster.png"
                  alt=""
                  aria-hidden="true"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover opacity-70"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />
                <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:100%_5px]" />
                <img
                  src="/demo.gif"
                  alt="MUTX dashboard demo"
                  width={1280}
                  height={801}
                  className="relative z-10 block h-auto w-full"
                />
                <motion.div
                  aria-hidden="true"
                  style={prefersReducedMotion ? undefined : { x: chromeShiftX, y: chromeShiftY }}
                  className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.08)_16%,transparent_34%,transparent_100%)] opacity-65 mix-blend-screen"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.3))]" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 mx-auto hidden w-full max-w-4xl flex-col items-center sm:flex">
          <div className="h-24 w-28 bg-[linear-gradient(180deg,rgba(164,177,192,0.98)_0%,rgba(99,112,126,0.98)_100%)] shadow-[0_28px_54px_rgba(2,6,23,0.4)] [clip-path:polygon(22%_0%,78%_0%,100%_100%,0_100%)]" />
          <div className="-mt-3 h-5 w-72 rounded-full bg-[linear-gradient(180deg,rgba(180,191,203,0.98)_0%,rgba(106,117,128,0.98)_100%)] shadow-[0_18px_40px_rgba(2,6,23,0.35)]" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[16%] bottom-0 h-16 rounded-full bg-black/70 blur-3xl"
        />
      </motion.div>
    </div>
  );
}
