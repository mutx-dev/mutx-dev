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

export function PublicFooter({ className, showCallout = true }: PublicFooterProps) {
  return (
    <footer className={cn("px-4 pb-8 pt-12 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-[1360px] border border-[rgba(233,241,232,0.14)] bg-[linear-gradient(180deg,rgba(16,26,32,0.98),rgba(6,9,13,0.98))] shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
        {showCallout ? (
          <div className="grid gap-6 border-b border-[rgba(233,241,232,0.12)] px-5 py-7 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end lg:px-8 lg:py-9">
            <div className="max-w-3xl">
              <p className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[#c6ff63]">
                Next step
              </p>
              <p className="mt-3 font-[family:var(--font-site-display)] text-[2.2rem] font-bold leading-[0.94] tracking-[-0.07em] text-[#e9f1e8]">
                {marketingFooterCallout.title}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(156,170,163,0.8)]">
                {marketingFooterCallout.body}
              </p>
            </div>
            {marketingFooterCallout.action.external ? (
              <a
                href={marketingFooterCallout.action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[3rem] items-center justify-center border border-[#c6ff63] bg-[#c6ff63] px-5 font-[family:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#06090d] transition hover:-translate-y-0.5 hover:border-[#e9f1e8] hover:bg-[#e9f1e8]"
              >
                {marketingFooterCallout.action.label}
              </a>
            ) : (
              <Link
                href={marketingFooterCallout.action.href}
                className="inline-flex min-h-[3rem] items-center justify-center border border-[#c6ff63] bg-[#c6ff63] px-5 font-[family:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#06090d] transition hover:-translate-y-0.5 hover:border-[#e9f1e8] hover:bg-[#e9f1e8]"
              >
                {marketingFooterCallout.action.label}
              </Link>
            )}
          </div>
        ) : null}

        <div className="grid gap-7 px-5 py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/logo.webp" alt="MUTX" width={22} height={22} className="h-5 w-5 object-contain" />
                <p className="font-[family:var(--font-site-display)] text-[1.2rem] font-bold tracking-[-0.05em] text-[#e9f1e8]">
                  MUTX
                </p>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[rgba(156,170,163,0.72)]">
                Control, visibility, and proof for the work your agents do.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {marketingFooterLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[rgba(156,170,163,0.72)] transition hover:text-[#c6ff63]"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[rgba(156,170,163,0.72)] transition hover:text-[#c6ff63]"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>

          <p className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] text-[rgba(156,170,163,0.58)]">
            © MUTX 2026 · open control for deployed agents
          </p>
        </div>
      </div>
    </footer>
  );
}
