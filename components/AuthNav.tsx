import Image from "next/image";
import Link from "next/link";

export function AuthNav() {
  return (
    <nav data-testid="public-auth-nav" className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4 rounded-full border border-[rgba(255,240,214,0.1)] bg-[rgba(10,9,12,0.78)] px-3 py-2.5 text-[#f7f0e4] shadow-[0_20px_60px_rgba(2,2,5,0.32)] backdrop-blur-xl">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 rounded-full border border-[rgba(255,240,214,0.08)] bg-[rgba(255,248,236,0.04)] px-2.5 py-2 pr-4 transition hover:border-[rgba(212,171,115,0.28)] hover:bg-[rgba(255,248,236,0.06)]"
            aria-label="Back to MUTX home"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,171,115,0.2)] bg-[radial-gradient(circle_at_top,rgba(212,171,115,0.2),transparent_58%),linear-gradient(180deg,rgba(255,248,236,0.08),rgba(255,248,236,0.02))]">
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
              <span className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[rgba(232,221,203,0.56)]">
                auth lane
              </span>
            </span>
          </Link>

        <span className="hidden rounded-full border border-[rgba(255,240,214,0.1)] bg-[rgba(255,248,236,0.03)] px-3 py-1.5 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[rgba(232,221,203,0.6)] lg:inline-flex">
          hosted operator identity
        </span>
      </div>
    </nav>
  );
}
