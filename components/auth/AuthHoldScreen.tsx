import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MonitorPlay } from "lucide-react";

type AuthHoldScreenProps = {
  mode: "login" | "register";
};

export function AuthHoldScreen({ mode }: AuthHoldScreenProps) {
  const title =
    mode === "login"
      ? "Operator sign-in is coming soon."
      : "Public sign-up is not open yet.";
  const description =
    mode === "login"
      ? "MUTX is still closing the hosted auth lane. The product today is the local-first control plane, CLI, TUI, and public dashboard demo."
      : "We are not opening public account creation until the hosted operator flow is stable. Use the quickstart, docs, or the public demo in the meantime.";

  return (
    <div className="site-page selection:bg-white/20">
      <main className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-6">
        <div className="w-[min(100%,44rem)]">
          <div className="site-form-card p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/[0.04]">
                <Image
                  src="/logo.png"
                  alt="MUTX logo"
                  fill
                  sizes="3.5rem"
                  className="object-contain p-1.5"
                />
              </div>
              <div>
                <p className="font-[family:var(--font-mono)] text-[0.72rem] uppercase tracking-[0.28em] text-white/50">
                  MUTX
                </p>
                <p className="text-sm text-white/64">
                  Control plane for agent ops
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-cyan-200">
              Auth lane paused
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-[3.4rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                "Open the public `/app` demo route.",
                "Run `mutx setup local` or `mutx setup hosted` from the docs.",
                "Operate the same `/v1/*` contract from web, CLI, and TUI.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white/68"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#quickstart" className="site-button-primary">
                Run quickstart
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/app" className="site-button-secondary">
                Open /app
                <MonitorPlay className="h-4 w-4" />
              </Link>
              <a
                href="https://docs.mutx.dev"
                target="_blank"
                rel="noreferrer"
                className="site-button-secondary"
              >
                Read docs
                <BookOpen className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
