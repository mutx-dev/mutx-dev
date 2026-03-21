import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/mutx-dev/mutx-dev";
const DOCS_URL = "https://docs.mutx.dev";

type PublicFooterProps = {
  className?: string;
};

const footerLinks = [
  { label: "Docs", href: DOCS_URL, external: true },
  { label: "GitHub", href: GITHUB_URL, external: true },
  { label: "Install", href: "/#install", external: false },
  { label: "Contact", href: "/contact", external: false },
  { label: "Privacy", href: "/privacy-policy", external: false },
] as const;

export function PublicFooter({ className }: PublicFooterProps) {
  return (
    <footer className={cn("site-footer", className)}>
      <div className="site-shell">
        <div className="site-footer-panel">
          <div className="site-footer-brand">
            <div className="site-brand-mark">
              <Image
                src="/logo.png"
                alt="MUTX"
                fill
                sizes="2.75rem"
                className="object-contain p-1.5"
              />
            </div>
            <div>
              <p className="site-brand-overline">MUTX</p>
              <p className="site-footer-note">
                Web, docs, CLI, and local proof lanes share one operator contract.
              </p>
            </div>
          </div>

          <div className="site-footer-links">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-nav-link"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className="site-nav-link">
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
