import Link from "next/link";

type AuthNavProps = { hostVariant?: "default" | "pico" };

export function AuthNav({ hostVariant = "default" }: AuthNavProps) {
  const isPico = hostVariant === "pico";
  return (
    <nav data-testid="public-auth-nav" className="sticky top-0 z-30 flex min-h-[5.5rem] items-stretch justify-between border-b border-[rgba(243,240,232,.18)] bg-[#0a0a09] text-[#f3f0e8]">
      <Link href="/" className="flex items-center px-6 font-[family:var(--font-site-body)] text-lg font-bold tracking-[-.05em] hover:text-[#ff4d00]">
        {isPico ? "PICO / MUTX" : "MUTX"}
      </Link>
      <span className="flex items-center border-l border-[rgba(243,240,232,.18)] px-6 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[.16em] text-[#8f8c84]">
        {isPico ? "Pico access" : "Account access"}
      </span>
    </nav>
  );
}
