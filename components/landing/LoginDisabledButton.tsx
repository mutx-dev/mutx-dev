"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type LoginDisabledButtonProps = {
  label?: string;
  className?: string;
  panelAlign?: "left" | "right";
};

const DOCS_URL = "https://docs.mutx.dev";

export function LoginDisabledButton({
  label = "Sign in",
  className,
  panelAlign = "right",
}: LoginDisabledButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-disabled="true"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-5 py-3 text-sm font-semibold text-slate-400 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-slate-200"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-500/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" />
        </span>
        {label}
        <LockKeyhole className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+0.85rem)] z-50 w-[min(92vw,22rem)] rounded-[26px] border border-[#1d2f46] bg-[linear-gradient(180deg,#0b1220_0%,#08101a_100%)] p-5 text-white shadow-[0_28px_90px_rgba(2,6,23,0.45)]",
            panelAlign === "left" ? "left-0" : "right-0",
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            coming soon
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-50">
            Operator sign-in is not public yet.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Hosted auth is still being finished. MUTX is local-first right now:
            use the quickstart, inspect the public `/app` demo, or read the docs
            while the sign-in lane hardens.
          </p>

          <div className="mt-5 grid gap-3">
            {[
              "Run the assistant-first quickstart from the landing page.",
              "Inspect the public dashboard demo route without creating an account.",
              "Use the CLI and TUI against the same mounted `/v1/*` contract.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/#quickstart"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Run quickstart
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/15"
            >
              Open /app
            </Link>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/15"
            >
              Read docs
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
