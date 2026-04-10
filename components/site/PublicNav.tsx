import Link from "next/link";
import { marketingPublicRailLinks } from "@/lib/marketingContent";
import styles from "@/components/site/marketing/MarketingCore.module.css";

export function PublicNav() {
  return (
    <div className={styles.publicRail}>
      <nav data-testid="public-auth-nav" className={styles.publicRailInner} aria-label="Public navigation">
        <Link href="/" className={styles.publicRailBrand}>
          <div className={styles.publicRailMark}>
            <img src="/logo.webp" alt="" aria-hidden="true" className={styles.brandMark} />
          </div>
          <div className={styles.publicRailCopy}>
            <span className={styles.publicRailTitle}>MUTX</span>
          </div>
        </Link>
        <div className={styles.publicRailLinks}>
          {marketingPublicRailLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.publicRailLink}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={styles.publicRailLink}>
                {link.label}
              </Link>
            ),
          )}
        </div>
      </nav>
    </div>
  );
}
