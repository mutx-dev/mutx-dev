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
        <div className="overflow-hidden rounded-[32px] border border-[rgba(255,240,214,0.1)] bg-[linear-gradient(180deg,rgba(17,15,20,0.96),rgba(10,9,12,0.98))] shadow-[0_32px_90px_rgba(2,2,5,0.4)]">
          {showCallout ? (
            <div className="grid gap-5 border-b border-[rgba(255,240,214,0.08)] px-5 py-6 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end lg:px-8 lg:py-8">
              <div className="max-w-3xl">
                <p className="font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[rgba(232,221,203,0.56)]">
                  Final lane
                </p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-[2rem] leading-[0.96] tracking-[-0.07em] text-[#f7f0e4]">
                  {marketingFooterCallout.title}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(232,221,203,0.74)]">
                  {marketingFooterCallout.body}
                </p>
              </div>
              {marketingFooterCallout.action.external ? (
                <a
                  href={marketingFooterCallout.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#edc492_0%,#c4844d_100%)] px-5 text-sm font-semibold text-[#1a1310] shadow-[0_20px_44px_rgba(92,56,27,0.24)] transition hover:-translate-y-[1px]"
                >
                  {marketingFooterCallout.action.label}
                </a>
              ) : (
                <Link
                  href={marketingFooterCallout.action.href}
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#edc492_0%,#c4844d_100%)] px-5 text-sm font-semibold text-[#1a1310] shadow-[0_20px_44px_rgba(92,56,27,0.24)] transition hover:-translate-y-[1px]"
                >
                  {marketingFooterCallout.action.label}
                </Link>
              )}
            </div>
          ) : null}

          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-7">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
              <div>
                <p className="font-[family:var(--font-site-display)] text-[1.2rem] tracking-[-0.05em] text-[#f7f0e4]">
                  MUTX
                </p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-[rgba(232,221,203,0.68)]">
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
                      className="rounded-full border border-[rgba(255,240,214,0.08)] bg-[rgba(255,248,236,0.03)] px-4 py-2 text-[13px] text-[rgba(232,221,203,0.72)] transition hover:bg-[rgba(255,248,236,0.06)] hover:text-[#f7f0e4]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="rounded-full border border-[rgba(255,240,214,0.08)] bg-[rgba(255,248,236,0.03)] px-4 py-2 text-[13px] text-[rgba(232,221,203,0.72)] transition hover:bg-[rgba(255,248,236,0.06)] hover:text-[#f7f0e4]"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>

            <p className="text-sm text-[rgba(232,221,203,0.62)]">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,171,115,0.2)] bg-[radial-gradient(circle_at_top,rgba(212,171,115,0.2),transparent_58%),linear-gradient(180deg,rgba(255,248,236,0.08),rgba(255,248,236,0.02))]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,248,236,0.04)]">
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
