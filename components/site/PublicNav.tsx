"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./PublicNav.module.css";

const NAV_ITEMS = [
  { label: "Product", href: "/ai-agent-control-plane" },
  { label: "Docs", href: "/docs" },
  { label: "Releases", href: "/releases" },
  { label: "Contact", href: "/contact" },
];

export function PublicNav({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`${styles.nav} ${overlay ? styles.overlay : ""}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="MUTX home">
          <span className={styles.brandMark}>
            <Image src="/logo.webp" alt="" aria-hidden="true" width={22} height={22} />
          </span>
          <span className={styles.brandCopy}>
            <span className={styles.brandName}>MUTX</span>
            <span className={styles.brandDescriptor}>agent operations</span>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? styles.navLinkActive : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.navActions}>
          <Link href="/download" className={styles.quietAction}>Download</Link>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer" className={styles.picoAction}>
            <span className={styles.liveDot} />
            Open Pico
            <ArrowUpRight aria-hidden="true" />
          </a>
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
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              {item.label}
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
          <Link href="/download" onClick={() => setMobileOpen(false)}>
            Download
            <ChevronRight aria-hidden="true" />
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
