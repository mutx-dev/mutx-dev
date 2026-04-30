"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const SESSION_KEY = "mutx-app-demo-intro-played";
const ACTIVE_ATTRIBUTE = "data-app-demo-intro-active";
const PLAYED_ATTRIBUTE = "data-app-demo-intro-played";
const APP_HOSTS = new Set(["app.mutx.dev", "app.localhost"]);
const INTRO_DURATION_MS = 3100;
const REDUCED_MOTION_DURATION_MS = 1200;

function markIntroComplete() {
  document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE);
  document.documentElement.setAttribute(PLAYED_ATTRIBUTE, "1");
}

function clearIntroState() {
  document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE);
  document.documentElement.removeAttribute(PLAYED_ATTRIBUTE);
}

function isAppDemoHost(hostname: string) {
  return APP_HOSTS.has(hostname.toLowerCase());
}

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

export function AppDomainDemoIntro() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [introArmed, setIntroArmed] = useState(false);
  const completedRef = useRef(false);

  const routeLabel = useMemo(() => {
    if (pathname === "/" || pathname === "/overview") {
      return "/dashboard";
    }

    return pathname;
  }, [pathname]);

  useEffect(() => {
    setMounted(true);

    const hostname = window.location.hostname.toLowerCase();
    const hasPlayedIntro = (() => {
      try {
        return window.sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        return false;
      }
    })();

    const shouldRunIntro =
      isAppDemoHost(hostname) &&
      !hasPlayedIntro;

    if (!shouldRunIntro) {
      if (!isAppDemoHost(hostname)) {
        clearIntroState();
      } else {
        markIntroComplete();
      }

      setIntroVisible(false);
      setIntroArmed(false);
      completedRef.current = false;
      return;
    }

    completedRef.current = false;
    document.documentElement.setAttribute(ACTIVE_ATTRIBUTE, "1");
    document.documentElement.removeAttribute(PLAYED_ATTRIBUTE);
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
          // Ignore storage failures and still hand off cleanly.
        }

        setIntroVisible(false);
      },
      prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [introArmed, introVisible, prefersReducedMotion]);

  return (
    <div
      className="mutx-app-demo-intro fixed inset-0 z-[120] pointer-events-none"
      data-mounted={mounted ? "1" : "0"}
    >
      <AnimatePresence
        onExitComplete={() => {
          if (!completedRef.current) {
            return;
          }

          markIntroComplete();
          setIntroArmed(false);
        }}
      >
        {introVisible ? (
          <motion.section
            key="mutx-app-demo-intro"
            initial={false}
            animate={{
              opacity: 1,
              transition: { duration: 0.24 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
            }}
            className="pointer-events-auto absolute inset-0 overflow-hidden bg-[#05070a] text-[#f8f1e6]"
            role="dialog"
            aria-label="MUTX demo intro"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(231,140,70,0.18),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(74,154,180,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(108,73,41,0.22),transparent_38%),linear-gradient(180deg,#06080c_0%,#040507_100%)]" />
            <motion.div
              initial={false}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.08 }
                  : { opacity: [0.06, 0.12, 0.08], scale: [1, 1.02, 1] }
              }
              transition={{
                duration: 2.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:58px_58px]"
            />
            <div className="absolute inset-x-[5%] top-[14%] h-px bg-gradient-to-r from-transparent via-[rgba(255,242,224,0.4)] to-transparent" />
            <div className="absolute inset-x-[5%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-[rgba(255,242,224,0.12)] to-transparent" />

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
                className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white/44 sm:text-[11px]"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <span className="font-[family:var(--font-site-display)] text-[1rem] tracking-[0.28em] text-white sm:text-[1.08rem]">
                    MUTX
                  </span>
                  <span className="h-px w-10 bg-white/14 sm:w-16" />
                  <span>Hosted preview gate</span>
                </motion.div>
                <motion.div variants={itemVariants} className="hidden items-center gap-2 sm:flex">
                  <Shield className="h-3.5 w-3.5 text-[#f0c78f]" />
                  <span>Safe demo surface</span>
                </motion.div>
              </motion.div>

              <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-16">
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
                      className="absolute inset-[16%] rounded-full border border-[rgba(240,199,143,0.16)]"
                    />
                    <motion.div
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 0.7 }
                          : { x: ["-12%", "12%", "0%"], opacity: [0.24, 0.92, 0.42] }
                      }
                      transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-[10%] top-1/2 h-px w-[80%] -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgba(125,210,233,0.9)] to-transparent"
                    />
                    <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle,rgba(240,199,143,0.16)_0%,rgba(240,199,143,0.05)_42%,transparent_72%)] blur-2xl" />
                    <motion.div
                      variants={itemVariants}
                      className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(15,23,33,0.96)_0%,rgba(6,11,17,1)_100%)] shadow-[0_30px_110px_rgba(0,0,0,0.48)] sm:h-32 sm:w-32 sm:rounded-[2.4rem] lg:h-36 lg:w-36"
                    >
                      <Image
                        src="/logo-transparent-v2.png"
                        alt=""
                        width={96}
                        height={96}
                        className="h-16 w-16 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                      />
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="absolute left-[2%] top-[18%] text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40 sm:left-[4%]"
                    >
                      preview data
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="absolute bottom-[18%] right-[1%] text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40 sm:right-[4%]"
                    >
                      narrated routes
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
                  <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,199,143,0.18)] bg-[rgba(240,199,143,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffe2bf]">
                    <Sparkles className="h-3.5 w-3.5" />
                    This is a demo
                  </motion.div>

                  <motion.h1
                    variants={itemVariants}
                    className="mt-5 font-[family:var(--font-site-display)] text-[2.9rem] leading-[0.88] tracking-[-0.07em] text-white sm:text-[4rem] lg:text-[4.8rem]"
                  >
                    Guided operator preview for the MUTX app domain.
                  </motion.h1>

                  <motion.p
                    variants={itemVariants}
                    className="mt-5 max-w-[34rem] text-[15px] leading-7 text-[rgba(247,238,225,0.72)] sm:text-[16px]"
                  >
                    The route map is real. Some fleet status, activity, and controls are staged
                    so the product can be shown cleanly before full operator auth.
                  </motion.p>

                  <motion.div
                    variants={itemVariants}
                    className="mt-6 h-px w-full max-w-[28rem] bg-gradient-to-r from-[rgba(240,199,143,0.8)] via-[rgba(125,210,233,0.28)] to-transparent"
                  />

                  <motion.div
                    variants={itemVariants}
                    className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54"
                  >
                    <span>Safe to explore</span>
                    <span>Synthetic narrative state</span>
                    <span>Hosted preview shell</span>
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
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[rgba(240,199,143,0.28)] bg-[linear-gradient(135deg,#f2dfc4_0%,#c89b62_100%)] px-5 text-sm font-semibold text-[#0d0d10] shadow-[0_18px_54px_rgba(200,155,98,0.2)] transition hover:-translate-y-0.5"
                    >
                      Enter demo now
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                        opening route
                      </div>
                      <div className="mt-2 font-[family:var(--font-mono)] text-sm text-[#f6ddbb]">
                        {routeLabel}
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
