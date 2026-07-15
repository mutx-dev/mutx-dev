import Image from "next/image";
import Link from "next/link";

import { marketingPublicRailLinks } from "@/lib/marketingContent";

export function PublicNav() {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <nav
        data-testid="public-auth-nav"
        aria-label="Public navigation"
        className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4 border border-[rgba(233,241,232,0.14)] bg-[rgba(6,9,13,0.86)] px-3 py-2.5 text-[#e9f1e8] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl"
      >
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-3 px-1.5 py-1.5 transition hover:text-[#c6ff63]"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center border border-[rgba(198,255,99,0.3)] bg-[rgba(198,255,99,0.08)]">
            <Image src="/logo.webp" alt="" aria-hidden="true" width={22} height={22} className="h-5 w-5 object-contain" />
          </span>
          <span className="grid min-w-0">
            <span className="font-[family:var(--font-site-display)] text-[1rem] font-bold leading-none tracking-[-0.06em]">
              MUTX
            </span>
            <span className="font-[family:var(--font-mono)] text-[9px] uppercase tracking-[0.2em] text-[rgba(156,170,163,0.72)]">
              agent operations
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {marketingPublicRailLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[rgba(156,170,163,0.8)] transition hover:text-[#e9f1e8]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[rgba(156,170,163,0.8)] transition hover:text-[#e9f1e8]"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-[family:var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-[rgba(156,170,163,0.58)] lg:inline">
            system / ready
          </span>
          <a
            href="https://pico.mutx.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#c6ff63] bg-[#c6ff63] px-3 py-2 font-[family:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.1em] text-[#06090d] transition hover:-translate-y-0.5 hover:border-[#e9f1e8] hover:bg-[#e9f1e8]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#06090d]" />
            Pico
          </a>
        </div>
      </nav>
    </div>
  );
}
