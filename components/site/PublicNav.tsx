"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPicoUrl } from "@/lib/seo";

import styles from "./PublicNav.module.css";

const NAV_ITEMS = [
  { label: "Product", href: "/control", external: false },
  { label: "Quickstart", href: "/docs/deployment/quickstart", external: false },
  { label: "GitHub", href: "https://github.com/mutx-dev/mutx-dev", external: true },
  { label: "Dashboard", href: "/dashboard", external: false },
] as const;

export function PublicNav({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname() ?? "/";
  const picoUrl = getPicoUrl();
  const navigationItems = NAV_ITEMS.map((item) => {
    const current = !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
    const productActive = item.label === "Product" && (pathname.startsWith("/ai-agent-") || pathname.startsWith("/control"));

    return {
      ...item,
      active: !item.external && (current || productActive),
      current,
    };
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const mobileLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 870px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMobileOpen(false);
    };

    mobileQuery.addEventListener("change", closeAtDesktop);
    return () => mobileQuery.removeEventListener("change", closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const isolatedElements = Array.from(document.body.children)
      .filter((element): element is HTMLElement =>
        element instanceof HTMLElement && element !== mobileLayerRef.current,
      )
      .map((element) => ({
        element,
        ariaHidden: element.getAttribute("aria-hidden"),
        inert: element.inert,
      }));

    document.body.style.overflow = "hidden";

    isolatedElements.forEach(({ element }) => {
      element.setAttribute("aria-hidden", "true");
      element.inert = true;
    });

    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuRef.current
        ?.querySelector<HTMLElement>('button:not([disabled]), a[href]')
        ?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      isolatedElements.reverse().forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
        element.inert = inert;
      });
      if (menuButtonRef.current?.isConnected) menuButtonRef.current.focus();
    };
  }, [mobileOpen]);

  return (
    <header data-testid="public-nav" className={`${styles.nav} ${overlay ? styles.overlay : ""}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="MUTX home">
          <span className={styles.brandMark} aria-hidden="true">MX</span>
          <span className={styles.brandCopy}>
            <strong>MUTX</strong>
            <small>AI agent workspace</small>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Primary navigation">
          {navigationItems.map((item) => item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label} <ArrowUpRight aria-hidden="true" />
                <span className={styles.visuallyHidden}> (opens in a new tab)</span>
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={item.active ? styles.active : undefined} aria-current={item.current ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
        </nav>

        <div className={styles.actions}>
          <a href={picoUrl} target="_blank" rel="noopener noreferrer" className={styles.pico}>
            PicoMUTX <ArrowUpRight aria-hidden="true" />
            <span className={styles.visuallyHidden}> (opens in a new tab)</span>
          </a>
          <Link href="/control" className={styles.cta}>
            Demo <ArrowRight className="rtl-directional-icon" aria-hidden="true" />
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

      {mobileOpen && typeof document !== "undefined" ? createPortal(
        <div ref={mobileLayerRef} className={styles.mobileLayer}>
          <div className={styles.mobileBackdrop} aria-hidden="true" />
          <nav
            ref={mobileMenuRef}
            id="public-mobile-navigation"
            className={styles.mobileMenu}
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-mobile-navigation-title"
          >
            <div className={styles.mobileMenuHeader}>
              <p id="public-mobile-navigation-title">
                <span aria-hidden="true" /> MUTX navigation
              </p>
              <button
                type="button"
                className={styles.mobileClose}
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            {navigationItems.map((item, index) => item.external ? (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  <span>{String(index + 1).padStart(2, "0")}</span>{item.label}<ArrowUpRight aria-hidden="true" />
                  <span className={styles.visuallyHidden}> (opens in a new tab)</span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.active ? styles.active : undefined}
                  onClick={() => setMobileOpen(false)}
                  aria-current={item.current ? "page" : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
                </Link>
              ))}
            <a href={picoUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
              <span>05</span>PicoMUTX<ArrowUpRight aria-hidden="true" />
              <span className={styles.visuallyHidden}> (opens in a new tab)</span>
            </a>
          </nav>
        </div>,
        document.body,
      ) : null}
    </header>
  );
}
