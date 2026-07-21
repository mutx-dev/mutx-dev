import Link from "next/link";

type AuthNavProps = { hostVariant?: "default" | "pico" };

export function AuthNav({ hostVariant = "default" }: AuthNavProps) {
  const isPico = hostVariant === "pico";
  return (
    <nav
      aria-label="Account navigation"
      data-testid="public-auth-nav"
      className="sticky top-0 z-30 flex min-h-[4.5rem] items-stretch border-b border-[rgba(243,240,232,.18)] bg-[#0b0c0b] text-[#f3f0e7]"
    >
      <Link
        href="/"
        className="flex items-center border-r border-[rgba(243,240,232,.18)] px-5 font-[family:var(--font-site-body)] text-lg font-bold tracking-[-.05em] transition hover:bg-[#ff4d00] hover:text-[#0b0c0b]"
      >
        {isPico ? "PICO / MUTX" : "MUTX"}
      </Link>
      <div className="ml-auto flex items-stretch">
        <Link href="/ai-agent-control-plane" className="hidden items-center px-4 font-[family:var(--font-mono)] text-[9px] uppercase tracking-[.14em] text-[#aaa69d] transition hover:text-white sm:flex">
          Product
        </Link>
        <Link href="/docs" className="hidden items-center px-4 font-[family:var(--font-mono)] text-[9px] uppercase tracking-[.14em] text-[#aaa69d] transition hover:text-white sm:flex">
          Docs
        </Link>
        <Link href="/dashboard" className="hidden items-center px-4 font-[family:var(--font-mono)] text-[9px] uppercase tracking-[.14em] text-[#aaa69d] transition hover:text-white sm:flex">
          Dashboard
        </Link>
        <Link href="/download" className="flex items-center border-l border-[rgba(243,240,232,.18)] px-4 font-[family:var(--font-mono)] text-[9px] uppercase tracking-[.14em] text-[#f3f0e7] transition hover:bg-[#ff4d00] hover:text-[#0b0c0b] sm:px-5">
          {isPico ? "Pico access" : "Download"}
        </Link>
      </div>
    </nav>
  );
}
