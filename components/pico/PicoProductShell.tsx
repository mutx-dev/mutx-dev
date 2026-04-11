"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, ListChecks, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";

import { usePicoPath } from "@/components/pico/PicoPathProvider";

type PicoProductShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

function navClasses(active: boolean) {
  return active
    ? "rounded-full border border-cyan-300/40 bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-cyan-100"
    : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white";
}

function pathIsActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function PicoProductShell({ title, description, actions, children }: PicoProductShellProps) {
  const pathname = usePathname();
  const homeHref = usePicoPath("/");
  const startHref = usePicoPath("/start");
  const academyHref = usePicoPath("/academy");
  const controlHref = usePicoPath("/control");
  const supportHref = usePicoPath("/support");
  const loginHref = usePicoPath("/login");
  const registerHref = usePicoPath("/register");

  return (
    <div className="site-page min-h-screen text-white">
      <header className="border-b border-white/10 bg-[#060914]/90 backdrop-blur">
        <div className="site-shell flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href={homeHref} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/45">Pico</p>
                <p className="text-sm font-semibold text-white/90">Build, launch, and operate with receipts.</p>
              </div>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href={startHref} className={navClasses(pathIsActive(pathname, startHref))}>
              <span className="inline-flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Start
              </span>
            </Link>
            <Link href={academyHref} className={navClasses(pathIsActive(pathname, academyHref))}>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Academy
              </span>
            </Link>
            <Link href={controlHref} className={navClasses(pathIsActive(pathname, controlHref))}>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Control
              </span>
            </Link>
            <Link href={supportHref} className={navClasses(pathIsActive(pathname, supportHref))}>
              <span className="inline-flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" /> Support
              </span>
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={loginHref}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href={registerHref}
              className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="site-shell py-8 lg:py-10">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,24,0.92),rgba(6,8,16,0.98))] p-6 shadow-[0_24px_90px_rgba(2,8,24,0.45)] lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Pico foundation slice
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-5xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/68 lg:text-base">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          </div>
        </section>

        <section className="mt-6 space-y-6">{children}</section>
      </main>

      <footer className="site-shell pb-10 pt-2 text-sm text-white/45">
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p>Pico shows guided lessons, real control-plane data, and grounded help from the lesson corpus. Start keeps the first run in one place.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={startHref} className="inline-flex items-center gap-2 font-semibold text-cyan-100">
              Open start <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={academyHref} className="inline-flex items-center gap-2 font-semibold text-white/70">
              Continue in academy <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
