"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function BrowserDashboardRedirect({
  href,
}: {
  href: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
      Redirecting…
    </div>
  );
}
