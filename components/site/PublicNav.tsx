"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./PublicNav.module.css";

const NAV_ITEMS = [
  { label: "Product", href: "/ai-agent-control-plane" },
  { label: "Docs", href: "/docs" },
  { label: "Releases", href: "/releases" },
  { label: "Contact", href: "/contact" },
] as const;

export function PublicNav({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`${styles.nav} ${overlay ? styles.overlay : ""}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="MUTX home">
          MUTX
        </Link>

        <nav className={styles.navLinks} aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const productActive = item.label === "Product" && pathname.startsWith("/ai-agent-");
            const active = productActive || pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer" className={styles.pico}>
            Pico <ArrowUpRight aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link href="/download" className={styles.download}>Download</Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className={styles.mobileMenu} aria-label="Mobile navigation">
          {NAV_ITEMS.map((item, index) => {
            const productActive = item.label === "Product" && pathname.startsWith("/ai-agent-");
            const active = productActive || pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
              </Link>
            );
          })}
          <Link href="/download" onClick={() => setMobileOpen(false)}><span>05</span>Download</Link>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer"><span>06</span>Pico ↗<span className="sr-only"> (opens in a new tab)</span></a>
        </nav>
      ) : null}
    </header>
  );
}
