"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { isPicoHost } from "@/lib/auth/redirects";

type PicoAuthPreviewIntroProps = {
  nextPath: string;
};

const SESSION_KEY = "mutx-pico-preview-intro-played";
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage is optional; the intro can still close safely.
  }
}

export function PicoAuthPreviewIntro({ nextPath }: PicoAuthPreviewIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const completedRef = useRef(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [introArmed, setIntroArmed] = useState(false);

  const destinationLabel = useMemo(() => {
    if (nextPath === "/" || nextPath === "") return "Pico home";
    return nextPath;
  }, [nextPath]);

  const dismissIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    markIntroPlayed();
    setIntroVisible(false);
  }, []);

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

    // The preview is decorative context, so reduced-motion users go straight
    // to the auth page instead of waiting through a shortened animation.
    if (prefersReducedMotion) {
      markIntroPlayed();
      setIntroVisible(false);
      setIntroArmed(false);
      completedRef.current = true;
      return;
    }

    completedRef.current = false;
    setIntroArmed(true);
    setIntroVisible(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!introVisible) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      enterButtonRef.current?.focus({ preventScroll: true });
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissIntro();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        event.preventDefault();
        dialogRef.current.focus({ preventScroll: true });
        return;
      }

      const activeElement = document.activeElement;
      if (!dialogRef.current.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [dismissIntro, introVisible]);

  if (!introArmed) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[130]">
      <AnimatePresence
        onExitComplete={() => {
          if (completedRef.current) setIntroArmed(false);
        }}
      >
        {introVisible ? (
          <motion.section
            ref={dialogRef}
            key="pico-auth-preview-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="pointer-events-auto absolute inset-0 overflow-y-auto bg-[#f3f0e8] text-[#0a0a09]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pico-preview-title"
            aria-describedby="pico-preview-description"
            tabIndex={-1}
          >
            <div className="grid min-h-full lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative grid min-h-[44vh] overflow-hidden border-b border-[#0a0a09] bg-[#ff4d00] p-5 sm:p-8 lg:min-h-full lg:border-b-0 lg:border-r lg:p-10 [background-image:linear-gradient(rgba(10,10,9,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,9,0.16)_1px,transparent_1px)] [background-size:3rem_3rem]">
                <div className="flex items-start justify-between font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.18em]">
                  <span>Pico / MUTX</span>
                  <span>Preview 00</span>
                </div>
                <div aria-hidden="true" className="relative self-center">
                  <span className="block font-[family:var(--font-site-body)] text-[clamp(11rem,34vw,31rem)] font-semibold leading-[0.62] tracking-[-0.14em]">
                    P
                  </span>
                  <span className="absolute bottom-0 left-1 right-0 h-px bg-[#0a0a09]" />
                  <span className="absolute -bottom-1.5 right-0 h-3 w-3 border border-[#0a0a09] bg-[#f3f0e8]" />
                </div>
                <p className="self-end font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.18em]">
                  Early access / active build
                </p>
              </div>

              <div className="flex items-center px-5 py-10 sm:px-10 sm:py-14 lg:px-[clamp(3rem,7vw,8rem)]">
                <div className="w-full max-w-[43rem]">
                  <p className="font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c83b00]">
                    Preview access gate
                  </p>
                  <h1
                    id="pico-preview-title"
                    className="mt-5 max-w-[10ch] font-[family:var(--font-site-body)] text-[clamp(3.2rem,7vw,7.4rem)] font-semibold leading-[0.82] tracking-[-0.085em]"
                  >
                    Pico is ready to try, and still being built.
                  </h1>
                  <p
                    id="pico-preview-description"
                    className="mt-7 max-w-[38rem] text-base leading-7 text-[#4f4d48] sm:text-lg sm:leading-8"
                  >
                    Sign in to explore what already works, save your place, and keep the route back to setup visible while the product evolves.
                  </p>

                  <div className="mt-8 grid border-y border-[#0a0a09] sm:grid-cols-3">
                    {['Working parts are usable', 'Routes may still change', 'Progress stays attached'].map((item, index) => (
                      <div
                        key={item}
                        className="grid min-h-20 content-center gap-1 border-b border-[#0a0a09] px-3 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                      >
                        <span className="font-[family:var(--font-mono)] text-[10px] text-[#c83b00]">0{index + 1}</span>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <button
                      ref={enterButtonRef}
                      type="button"
                      onClick={dismissIntro}
                      className="inline-flex min-h-12 items-center justify-center gap-3 border border-[#0a0a09] bg-[#0a0a09] px-5 font-[family:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[#f3f0e8] transition hover:bg-[#ff4d00] hover:text-[#0a0a09] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#ff4d00]"
                    >
                      Enter preview
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <div className="text-left sm:text-right">
                      <div className="font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e6b64]">
                        after sign-in
                      </div>
                      <div className="mt-2 font-[family:var(--font-mono)] text-sm text-[#c83b00]">
                        {destinationLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
