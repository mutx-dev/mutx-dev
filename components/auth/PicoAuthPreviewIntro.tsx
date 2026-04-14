"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import Image from "next/image";

import { isPicoHost } from "@/lib/auth/redirects";

type PicoAuthPreviewIntroProps = {
  nextPath: string;
};

const SESSION_KEY = "mutx-pico-preview-intro-played";
const INTRO_DURATION_MS = 3200;
const REDUCED_MOTION_DURATION_MS = 1400;

const revealTransition = {
  duration: 0.56,
  ease: [0.22, 1, 0.36, 1] as const,
};

const itemVariants = {
  active: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: revealTransition,
  },
  exit: {
    opacity: 0,
    y: -18,
    filter: "blur(8px)",
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] as const },
  },
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(12px)",
  },
};

export function PicoAuthPreviewIntro({
  nextPath,
}: PicoAuthPreviewIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  const completedRef = useRef(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [introArmed, setIntroArmed] = useState(false);

  const destinationLabel = useMemo(() => {
    if (nextPath === "/" || nextPath === "") {
      return "Pico home";
    }

    return nextPath;
  }, [nextPath]);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const hasPlayedIntro = (() => {
      try {
        return window.sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        return false;
      }
    })();

    if (!isPicoHost(hostname) || hasPlayedIntro) {
      setIntroVisible(false);
      setIntroArmed(false);
      completedRef.current = false;
      return;
    }

    completedRef.current = false;
    setIntroArmed(true);
    setIntroVisible(true);
  }, []);

  useEffect(() => {
    if (!introArmed || !introVisible) {
      return undefined;
    }

    const timeout = window.setTimeout(
      () => {
        if (completedRef.current) {
          return;
        }

        completedRef.current = true;

        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // Ignore storage failures and still dismiss the intro.
        }

        setIntroVisible(false);
      },
      prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [introArmed, introVisible, prefersReducedMotion]);

  useEffect(() => {
    if (!introVisible) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [introVisible]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[130]">
      <AnimatePresence
        onExitComplete={() => {
          if (completedRef.current) {
            setIntroArmed(false);
          }
        }}
      >
        {introVisible ? (
          <motion.section
            key="pico-auth-preview-intro"
            initial={false}
            animate={{
              opacity: 1,
              transition: { duration: 0.24 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
            }}
            className="pointer-events-auto absolute inset-0 overflow-hidden bg-[#040903] text-[#f3faee]"
            role="dialog"
            aria-label="Pico preview intro"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(159,255,78,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(115,239,190,0.14),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(73,129,29,0.22),transparent_36%),linear-gradient(180deg,#050904_0%,#030702_100%)]" />
            <motion.div
              initial={false}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.08 }
                  : { opacity: [0.06, 0.11, 0.08], scale: [1, 1.02, 1] }
              }
              transition={{
                duration: 2.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 [background-image:linear-gradient(rgba(223,255,154,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(223,255,154,0.12)_1px,transparent_1px)] [background-size:58px_58px]"
            />
            <div className="absolute inset-x-[5%] top-[14%] h-px bg-gradient-to-r from-transparent via-[rgba(223,255,154,0.42)] to-transparent" />
            <div className="absolute inset-x-[5%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-[rgba(223,255,154,0.16)] to-transparent" />

            <div className="relative flex h-full flex-col px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 lg:px-12 lg:pb-10 lg:pt-8">
              <motion.div
                initial="hidden"
                animate="active"
                exit="exit"
                variants={{
                  active: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.08,
                    },
                  },
                  exit: {
                    transition: {
                      staggerChildren: 0.04,
                      staggerDirection: -1,
                    },
                  },
                }}
                className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50 sm:text-[11px]"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <span className="font-[family:var(--font-site-display)] text-[1rem] tracking-[0.24em] text-white sm:text-[1.08rem]">
                    Pico
                  </span>
                  <span className="h-px w-10 bg-white/14 sm:w-16" />
                  <span>Preview access gate</span>
                </motion.div>
                <motion.div variants={itemVariants} className="hidden items-center gap-2 sm:flex">
                  <Shield className="h-3.5 w-3.5 text-[#dfff9a]" />
                  <span>Safe to explore</span>
                </motion.div>
              </motion.div>

              <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)] lg:gap-16">
                <motion.div
                  initial="hidden"
                  animate="active"
                  exit="exit"
                  variants={{
                    active: {
                      transition: {
                        staggerChildren: 0.12,
                        delayChildren: 0.14,
                      },
                    },
                    exit: {
                      transition: {
                        staggerChildren: 0.05,
                        staggerDirection: -1,
                      },
                    },
                  }}
                  className="relative flex items-center justify-center lg:justify-start"
                >
                  <motion.div
                    variants={itemVariants}
                    className="relative flex aspect-square w-full max-w-[20rem] items-center justify-center sm:max-w-[24rem] lg:max-w-[28rem]"
                  >
                    <motion.div
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : {
                              rotate: [0, 6, -4, 0],
                              scale: [1, 1.02, 0.995, 1],
                            }
                      }
                      transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-[6%] rounded-full border border-white/[0.1]"
                    />
                    <motion.div
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : {
                              rotate: [0, -10, 0],
                              scale: [0.96, 1, 0.98],
                            }
                      }
                      transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-[16%] rounded-full border border-[rgba(159,255,78,0.16)]"
                    />
                    <motion.div
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 0.7 }
                          : { x: ["-12%", "12%", "0%"], opacity: [0.22, 0.9, 0.38] }
                      }
                      transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-[10%] top-1/2 h-px w-[80%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgba(195,255,91,0.92)] to-transparent"
                    />
                    <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle,rgba(159,255,78,0.16)_0%,rgba(159,255,78,0.04)_42%,transparent_72%)] blur-2xl" />
                    <motion.div
                      variants={itemVariants}
                      className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(15,26,12,0.96)_0%,rgba(5,12,5,1)_100%)] shadow-[0_30px_110px_rgba(0,0,0,0.48)] sm:h-32 sm:w-32 sm:rounded-[2.4rem] lg:h-36 lg:w-36"
                    >
                      <Image
                        src="/pico/logo.png"
                        alt=""
                        width={96}
                        height={96}
                        className="h-16 w-16 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                      />
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="absolute left-[2%] top-[18%] text-[10px] font-semibold uppercase tracking-[0.22em] text-white/44 sm:left-[4%]"
                    >
                      early preview
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="absolute bottom-[18%] right-[1%] text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-white/44 sm:right-[4%]"
                    >
                      active build
                    </motion.div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="active"
                  exit="exit"
                  variants={{
                    active: {
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.18,
                      },
                    },
                    exit: {
                      transition: {
                        staggerChildren: 0.04,
                        staggerDirection: -1,
                      },
                    },
                  }}
                  className="max-w-[38rem]"
                >
                  <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(195,255,91,0.22)] bg-[rgba(159,255,78,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7ffc2]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Still being built
                  </motion.div>

                  <motion.h1
                    variants={itemVariants}
                    className="mt-5 font-[family:var(--font-site-display)] text-[2.9rem] leading-[0.88] tracking-[-0.07em] text-white sm:text-[4rem] lg:text-[4.8rem]"
                  >
                    Pico is live enough to try, but not finished yet.
                  </motion.h1>

                  <motion.p
                    variants={itemVariants}
                    className="mt-5 max-w-[34rem] text-[15px] leading-7 text-[rgba(243,250,238,0.72)] sm:text-[16px]"
                  >
                    This sign-in step is for the early preview. You can explore
                    what is already working, save your place, and watch the
                    product improve while we keep building the rest.
                  </motion.p>

                  <motion.div
                    variants={itemVariants}
                    className="mt-6 h-px w-full max-w-[28rem] bg-gradient-to-r from-[rgba(195,255,91,0.82)] via-[rgba(115,239,190,0.28)] to-transparent"
                  />

                  <motion.div
                    variants={itemVariants}
                    className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56"
                  >
                    <span>Some parts are ready</span>
                    <span>Some parts will change</span>
                    <span>Your progress stays attached</span>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (completedRef.current) {
                          return;
                        }

                        completedRef.current = true;

                        try {
                          window.sessionStorage.setItem(SESSION_KEY, "1");
                        } catch {
                          // Ignore storage failures and still dismiss the intro.
                        }

                        setIntroVisible(false);
                      }}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[rgba(195,255,91,0.28)] bg-[linear-gradient(135deg,#dfff9a_0%,#73efbe_100%)] px-5 text-sm font-semibold text-[#071404] shadow-[0_18px_54px_rgba(115,239,190,0.2)] transition hover:-translate-y-0.5"
                    >
                      Enter preview
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                        after sign-in
                      </div>
                      <div className="mt-2 font-[family:var(--font-mono)] text-sm text-[#dfff9a]">
                        {destinationLabel}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
