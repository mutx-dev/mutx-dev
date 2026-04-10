import Image from "next/image";
import Link from "next/link";

import {
  marketingFooterCallout,
  marketingFooterLinks,
} from "@/lib/marketingContent";
import { cn } from "@/lib/utils";
import styles from "@/components/site/marketing/MarketingCore.module.css";

type PublicFooterProps = {
  className?: string;
  showCallout?: boolean;
};

export function PublicFooter({
  className,
  showCallout = true,
}: PublicFooterProps) {
  return (
    <footer className={cn(styles.footer, className)}>
      <div className={styles.shell}>
        <div className={styles.footerInner}>
          {showCallout ? (
            <div className={styles.footerCallout}>
              <p className={styles.footerTitle}>{marketingFooterCallout.title}</p>
              <p className={styles.footerText}>{marketingFooterCallout.body}</p>
              {marketingFooterCallout.action.external ? (
                <a
                  href={marketingFooterCallout.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.buttonPrimary}
                >
                  {marketingFooterCallout.action.label}
                </a>
              ) : (
                <Link href={marketingFooterCallout.action.href} className={styles.buttonPrimary}>
                  {marketingFooterCallout.action.label}
                </Link>
              )}
            </div>
          ) : null}

          <div className={styles.footerBottom}>
            <div className={styles.footerLinks}>
              {marketingFooterLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ),
              )}
            </div>

            <p className={styles.footerMeta}>
              <span className="inline-flex items-center gap-3">
                <span className={styles.brand}>
                  <span className={styles.brandMarkWrap}>
                    <Image
                      src="/logo.webp"
                      alt="MUTX"
                      width={32}
                      height={32}
                      className={styles.brandMark}
                    />
                  </span>
                </span>
                <span>© MUTX 2026. Open control for deployed agents.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
