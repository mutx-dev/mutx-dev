"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./PublicNav.module.css";

const NAV_ITEMS = [
  { label: "Docs", href: "/docs" },
  { label: "Releases", href: "/releases" },
  { label: "Contact", href: "/contact" },
];

const PRODUCT_LINKS = [
  { label: "Control plane", href: "/ai-agent-control-plane", note: "Run the fleet" },
  { label: "Monitoring", href: "/ai-agent-monitoring", note: "Read every run" },
  { label: "Guardrails", href: "/ai-agent-guardrails", note: "Stop risky actions" },
  { label: "Governance", href: "/ai-agent-governance", note: "Set the boundary" },
  { label: "Cost", href: "/ai-agent-cost", note: "Control spend" },
  { label: "Deployment", href: "/ai-agent-deployment", note: "Ship with proof" },
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
          <div className={styles.productCluster}>
            <Link
              href="/ai-agent-control-plane"
              className={`${styles.navLink} ${pathname.startsWith("/ai-agent-") ? styles.navLinkActive : ""}`}
            >
              Product
            </Link>
            <div className={styles.productMenu}>
              <div className={styles.productMenuIntro}>
                <span>Agent operations</span>
                <strong>One system for the work after the prompt.</strong>
              </div>
              <div className={styles.productMenuGrid}>
                {PRODUCT_LINKS.map((item, index) => (
                  <Link key={item.href} href={item.href}>
                    <span className={styles.productIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.note}</small>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
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
            Pico beta status
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
          <p className={styles.mobileLabel}>Product</p>
          {PRODUCT_LINKS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              {item.label}
              <ChevronRight aria-hidden="true" />
            </Link>
          ))}
          <p className={styles.mobileLabel}>Company</p>
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
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
            Pico beta status
            <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      ) : null}
    </header>
  );
}
