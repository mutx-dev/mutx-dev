import Image from "next/image";
import Link from "next/link";

export function AuthNav() {
  return (
    <nav data-testid="public-auth-nav" className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4 rounded-[28px] border border-[rgba(132,184,255,0.16)] bg-[linear-gradient(180deg,rgba(7,11,19,0.82),rgba(5,8,14,0.94))] px-3 py-2.5 text-[#edf6ff] shadow-[0_24px_80px_rgba(2,8,22,0.34)] backdrop-blur-xl">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 rounded-full border border-[rgba(132,184,255,0.12)] bg-[rgba(255,255,255,0.03)] px-2.5 py-2 pr-4 transition hover:border-[rgba(132,184,255,0.26)] hover:bg-[rgba(255,255,255,0.05)]"
            aria-label="Back to MUTX home"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(132,184,255,0.2)] bg-[radial-gradient(circle_at_top,rgba(111,198,255,0.28),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_10px_24px_rgba(10,68,134,0.22)]">
              <Image
                src="/logo.webp"
                alt="MUTX"
                width={32}
                height={32}
                className="h-5 w-5 object-contain"
              />
            </span>
            <span className="grid min-w-0">
              <span className="truncate font-[family:var(--font-site-display)] text-[1rem] leading-none tracking-[-0.06em]">
                MUTX
              </span>
              <span className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[rgba(170,206,242,0.56)]">
                auth lane
              </span>
            </span>
          </Link>

        <span className="hidden rounded-full border border-[rgba(132,184,255,0.14)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[rgba(188,212,238,0.64)] lg:inline-flex">
          hosted operator identity
        </span>
      </div>
    </nav>
  );
}
