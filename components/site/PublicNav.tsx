import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { marketingPublicRailLinks } from "@/lib/marketingContent";

export function PublicNav() {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <nav
        data-testid="public-auth-nav"
        aria-label="Public navigation"
        className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4 rounded-[28px] border border-[rgba(132,184,255,0.16)] bg-[linear-gradient(180deg,rgba(7,11,19,0.82),rgba(5,8,14,0.94))] px-3 py-2.5 text-[#edf6ff] shadow-[0_24px_80px_rgba(2,8,22,0.34)] backdrop-blur-xl"
      >
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-3 rounded-full border border-[rgba(132,184,255,0.12)] bg-[rgba(255,255,255,0.03)] px-2.5 py-2 pr-4 transition hover:border-[rgba(132,184,255,0.26)] hover:bg-[rgba(255,255,255,0.05)]"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(132,184,255,0.2)] bg-[radial-gradient(circle_at_top,rgba(111,198,255,0.28),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_10px_24px_rgba(10,68,134,0.22)]">
            <Image src="/logo.webp" alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 object-contain" />
          </span>
          <span className="grid min-w-0">
            <span className="truncate font-[family:var(--font-site-display)] text-[1rem] leading-none tracking-[-0.06em]">
              MUTX
            </span>
            <span className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[rgba(170,206,242,0.56)]">
              open control plane
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 xl:flex">
          {marketingPublicRailLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-4 py-2 text-[13px] text-[rgba(188,212,238,0.78)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#edf6ff]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-[13px] text-[rgba(188,212,238,0.78)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#edf6ff]"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <a
          href="https://pico.mutx.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-[linear-gradient(135deg,#dfff9a_0%,#52c51c_100%)] px-4 text-[13px] font-semibold text-[#071404] shadow-[0_16px_34px_rgba(159,255,78,0.2)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(159,255,78,0.24)]"
        >
          <span className="hidden sm:inline">Go to PicoMUTX</span>
          <span className="sm:hidden">Pico</span>
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </nav>
    </div>
  );
}
