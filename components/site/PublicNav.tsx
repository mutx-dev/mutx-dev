"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "./PublicNav.module.css";

const NAV_ITEMS = [
  { label: "Product", href: "/ai-agent-control-plane", external: false },
  { label: "Docs", href: "/docs", external: false },
  { label: "GitHub", href: "https://github.com/mutx-dev/mutx-dev", external: true },
  { label: "Dashboard", href: "/dashboard", external: false },
] as const;

export function PublicNav({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <header data-testid="public-nav" className={`${styles.nav} ${overlay ? styles.overlay : ""}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="MUTX home">
          <span className={styles.brandMark} aria-hidden="true">MX</span>
          <span className={styles.brandCopy}>
            <strong>MUTX</strong>
            <small>Agent operations</small>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const productActive = item.label === "Product" && pathname.startsWith("/ai-agent-");
            const active = !item.external && (productActive || pathname === item.href || pathname.startsWith(`${item.href}/`));

            return item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label} <ArrowUpRight aria-hidden="true" />
                <span className={styles.visuallyHidden}> (opens in a new tab)</span>
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer" className={styles.pico}>
            Pico <ArrowUpRight aria-hidden="true" /><span className={styles.visuallyHidden}> (opens in a new tab)</span>
          </a>
          <Link href="/download" className={styles.download}>
            Download <ArrowRight aria-hidden="true" />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav id="public-mobile-navigation" className={styles.mobileMenu} aria-label="Mobile navigation">
          <p><span aria-hidden="true" /> Control plane navigation</p>
          {NAV_ITEMS.map((item, index) => {
            const productActive = item.label === "Product" && pathname.startsWith("/ai-agent-");
            const active = !item.external && (productActive || pathname === item.href || pathname.startsWith(`${item.href}/`));

            return item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                <span>{String(index + 1).padStart(2, "0")}</span>{item.label}<ArrowUpRight aria-hidden="true" />
                <span className={styles.visuallyHidden}> (opens in a new tab)</span>
              </a>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
              </Link>
            );
          })}
          <Link href="/download" onClick={() => setMobileOpen(false)} className={styles.mobileDownload}>
            <span>05</span>Download<ArrowRight aria-hidden="true" />
          </Link>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer">
            <span>06</span>Pico<ArrowUpRight aria-hidden="true" />
            <span className={styles.visuallyHidden}> (opens in a new tab)</span>
          </a>
        </nav>
      ) : null}
    </header>
  );
}
