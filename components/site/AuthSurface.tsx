import Image from "next/image";
import type { ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";

type AuthSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideEyebrow: string;
  asideTitle: string;
  asideBody: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaWidth: number;
  mediaHeight: number;
  highlights: readonly string[];
  children: ReactNode;
  variant?: "access" | "recovery";
};

export function AuthSurface({
  eyebrow,
  title,
  description,
  asideEyebrow,
  asideTitle,
  asideBody,
  mediaSrc,
  mediaAlt,
  mediaWidth,
  mediaHeight,
  highlights,
  children,
  variant = "access",
}: AuthSurfaceProps) {
  const isRecovery = variant === "recovery";

  return (
    <PublicSurface className="site-page">
      <AuthNav />

      <main className="site-main">
        <section
          className="site-section pb-6 sm:pb-8"
          data-route-surface="dark"
        >
          <div className="site-shell">
            <div className="studio-frame overflow-hidden rounded-[38px] px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
              <div
                className={
                  isRecovery
                    ? "grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(19rem,0.82fr)] lg:items-start"
                    : "grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(21rem,0.98fr)] lg:items-end"
                }
              >
                <div className="space-y-5">
                  <span className="studio-chip">{eyebrow}</span>
                  <div className="space-y-4">
                    <h1 className="max-w-3xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[#edf6ff] sm:text-6xl">
                      {title}
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-[rgba(201,219,241,0.78)]">
                      {description}
                    </p>
                  </div>

                  <div className="studio-inset max-w-2xl rounded-[28px] p-4 sm:p-5">
                    <p className="font-[family:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#88ceff]">
                      {asideEyebrow}
                    </p>
                    <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[#edf6ff]">
                      {asideTitle}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[rgba(191,214,240,0.74)]">
                      {asideBody}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    isRecovery
                      ? "studio-plane relative overflow-hidden rounded-[32px] p-3 sm:p-4 lg:max-w-[26rem] lg:justify-self-end"
                      : "studio-plane relative overflow-hidden rounded-[32px] p-3 sm:p-4"
                  }
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(111,198,255,0.18),transparent_28%)]" />
                  <Image
                    src={mediaSrc}
                    alt={mediaAlt}
                    width={mediaWidth}
                    height={mediaHeight}
                    sizes="(max-width: 1024px) 100vw, 34rem"
                    className={
                      isRecovery
                        ? "h-full min-h-[15rem] w-full rounded-[26px] object-cover"
                        : "h-full min-h-[18rem] w-full rounded-[26px] object-cover"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-section pt-0" data-route-surface="light">
          <div className="site-shell">
            <div
              className={
                isRecovery
                  ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
                  : "grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]"
              }
            >
              <div
                className={
                  isRecovery
                    ? "rounded-[34px] border border-[rgba(166,201,255,0.14)] bg-[linear-gradient(180deg,rgba(10,15,24,0.98),rgba(7,10,16,0.98))] p-5 text-[#edf6ff] shadow-[0_28px_80px_rgba(2,8,22,0.26)] sm:p-6 lg:p-7 lg:max-w-[52rem]"
                    : "rounded-[34px] border border-[rgba(166,201,255,0.14)] bg-[linear-gradient(180deg,rgba(10,15,24,0.98),rgba(7,10,16,0.98))] p-5 text-[#edf6ff] shadow-[0_28px_80px_rgba(2,8,22,0.26)] sm:p-6 lg:p-7"
                }
              >
                {children}
              </div>

              <div className="rounded-[32px] border border-[rgba(166,201,255,0.14)] bg-[linear-gradient(180deg,rgba(12,18,28,0.96),rgba(7,10,16,0.98))] p-5 text-[#edf6ff] shadow-[0_24px_64px_rgba(2,8,22,0.22)] sm:p-6">
                <p className="font-[family:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#88ceff]">
                  {isRecovery ? "Recovery checklist" : "Operator checklist"}
                </p>
                <div className="mt-4 grid gap-3">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[rgba(166,201,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-[rgba(191,214,240,0.82)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicSurface>
  );
}
