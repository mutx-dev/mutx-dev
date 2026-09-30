import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPicoUrl } from "@/lib/seo";

import styles from "./PublicFooter.module.css";

type PublicFooterProps = { className?: string; showCallout?: boolean };

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Browser preview", href: "/control", external: false },
      { label: "Dashboard", href: "/dashboard", external: false },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Deployment quickstart", href: "/docs/deployment/quickstart", external: false },
      { label: "Documentation", href: "/docs", external: false },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "PicoMUTX", href: getPicoUrl(), external: true },
      { label: "GitHub", href: "https://github.com/mutx-dev/mutx-dev", external: true },
      { label: "Releases", href: "/releases", external: false },
    ],
  },
] as const;

export function PublicFooter({ className, showCallout = true }: PublicFooterProps) {
  return (
    <footer className={cn(styles.footer, className)}>
      {showCallout ? (
        <div className={styles.callout}>
          <div>
            <p>Explore MUTX</p>
            <h2>Start with a product preview.</h2>
          </div>
          <div className={styles.calloutAction}>
            <p>See the browser demonstration or follow the local setup guide.</p>
            <Link href="/control">
              Explore the product <ArrowRight className="rtl-directional-icon" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className={styles.footerMain}>
        <div className={styles.identity}>
          <Link href="/" className={styles.brand} aria-label="MUTX home">
            <span aria-hidden="true">M</span>
            <strong>MUTX</strong>
          </Link>
          <p>Run records, tool calls, and approval workflows for AI agents.</p>
          <span className={styles.availability}>Source available · CLI · SDK</span>
        </div>

        <div className={styles.linkGrid}>
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={`${group.title} footer navigation`}>
              <p>{group.title}</p>
              {group.links.map((link) => link.external ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label} <ArrowUpRight aria-hidden="true" />
                  <span className={styles.visuallyHidden}> (opens in a new tab)</span>
                </a>
              ) : (
                <Link key={link.label} href={link.href}>{link.label}</Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© MUTX 2026 · Source available</p>
        <nav aria-label="Legal navigation">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/security">Security</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
