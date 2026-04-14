import Image from "next/image";
import Link from "next/link";

import {
  marketingFooterCallout,
  marketingFooterLinks,
} from "@/lib/marketingContent";
import { cn } from "@/lib/utils";

type PublicFooterProps = {
  className?: string;
  showCallout?: boolean;
};

export function PublicFooter({
  className,
  showCallout = true,
}: PublicFooterProps) {
  return (
    <footer className={cn("px-4 pb-8 pt-12 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="overflow-hidden rounded-[32px] border border-[rgba(132,184,255,0.14)] bg-[radial-gradient(circle_at_top_right,rgba(91,162,255,0.18),transparent_24%),linear-gradient(180deg,rgba(8,12,20,0.96),rgba(5,8,14,0.98))] shadow-[0_32px_90px_rgba(2,8,22,0.38)]">
          {showCallout ? (
            <div className="grid gap-5 border-b border-[rgba(132,184,255,0.1)] px-5 py-6 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end lg:px-8 lg:py-8">
              <div className="max-w-3xl">
                <p className="font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[rgba(150,199,255,0.7)]">
                  Final lane
                </p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-[2rem] leading-[0.96] tracking-[-0.07em] text-[#edf6ff]">
                  {marketingFooterCallout.title}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(191,214,240,0.78)]">
                  {marketingFooterCallout.body}
                </p>
              </div>
              {marketingFooterCallout.action.external ? (
                <a
                  href={marketingFooterCallout.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[rgba(132,184,255,0.26)] bg-[linear-gradient(135deg,#dff2ff_0%,#5faeff_100%)] px-5 text-sm font-semibold text-[#04111e] shadow-[0_20px_44px_rgba(31,93,167,0.22)] transition hover:-translate-y-[1px]"
                >
                  {marketingFooterCallout.action.label}
                </a>
              ) : (
                <Link
                  href={marketingFooterCallout.action.href}
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[rgba(132,184,255,0.26)] bg-[linear-gradient(135deg,#dff2ff_0%,#5faeff_100%)] px-5 text-sm font-semibold text-[#04111e] shadow-[0_20px_44px_rgba(31,93,167,0.22)] transition hover:-translate-y-[1px]"
                >
                  {marketingFooterCallout.action.label}
                </Link>
              )}
            </div>
          ) : null}

          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-7">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
              <div>
                <p className="font-[family:var(--font-site-display)] text-[1.2rem] tracking-[-0.05em] text-[#edf6ff]">
                  MUTX
                </p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-[rgba(191,214,240,0.72)]">
                  One brand frame for the public site, docs, auth, dashboard, and Pico product.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {marketingFooterLinks.map((link) =>
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[rgba(132,184,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[13px] text-[rgba(191,214,240,0.76)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#edf6ff]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="rounded-full border border-[rgba(132,184,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[13px] text-[rgba(191,214,240,0.76)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#edf6ff]"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>

            <p className="text-sm text-[rgba(191,214,240,0.68)]">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(132,184,255,0.2)] bg-[radial-gradient(circle_at_top,rgba(111,198,255,0.28),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_10px_24px_rgba(10,68,134,0.22)]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
                    <Image
                      src="/logo.webp"
                      alt="MUTX"
                      width={20}
                      height={20}
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                </span>
                <span>© MUTX 2026. Open control for deployed agents.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
