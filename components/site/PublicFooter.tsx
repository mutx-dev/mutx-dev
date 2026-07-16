import Link from "next/link";

import { marketingFooterLinks } from "@/lib/marketingContent";
import { cn } from "@/lib/utils";

type PublicFooterProps = { className?: string; showCallout?: boolean };

export function PublicFooter({ className, showCallout = true }: PublicFooterProps) {
  return (
    <footer className={cn("bg-[#0a0a09] text-[#f3f0e8]", className)}>
      {showCallout ? (
        <div className="mx-auto grid w-[min(100%-2rem,112rem)] gap-8 border-b border-[rgba(243,240,232,.2)] py-[clamp(5rem,10vw,10rem)] md:grid-cols-[1fr_auto] md:items-end">
          <p className="m-0 max-w-[9ch] font-[family:var(--font-site-body)] text-[clamp(4rem,9vw,10rem)] font-bold leading-[.82] tracking-[-.08em]">Run agents.<br />Know why.</p>
          <Link href="/download" className="inline-flex min-h-14 items-center justify-center bg-[#ff4d00] px-6 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[.12em] text-[#0a0a09] hover:bg-[#f3f0e8]">Get MUTX</Link>
        </div>
      ) : null}
      <div className="mx-auto grid w-[min(100%-2rem,112rem)] gap-10 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="m-0 font-[family:var(--font-site-body)] text-2xl font-bold tracking-[-.06em]">MUTX</p>
          <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer">
            {marketingFooterLinks.map((link) => link.external ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-[family:var(--font-mono)] text-[10px] uppercase tracking-[.12em] text-[#8f8c84] hover:text-[#ff4d00]">{link.label}</a>
            ) : (
              <Link key={link.label} href={link.href} className="inline-flex min-h-11 items-center font-[family:var(--font-mono)] text-[10px] uppercase tracking-[.12em] text-[#8f8c84] hover:text-[#ff4d00]">{link.label}</Link>
            ))}
          </nav>
        </div>
        <p className="m-0 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[.1em] text-[#8f8c84]">© MUTX 2026</p>
      </div>
    </footer>
  );
}
