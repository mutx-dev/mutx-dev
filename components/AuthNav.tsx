import Image from "next/image";
import Link from "next/link";
import styles from "@/components/site/marketing/MarketingCore.module.css";

export function AuthNav() {
  return (
    <nav data-testid="public-auth-nav" className={styles.publicRail}>
      <div className={styles.shell}>
        <div className={styles.publicRailInner}>
          <Link
            href="/"
            className={styles.publicRailBrand}
            aria-label="Back to MUTX home"
          >
            <span className={styles.publicRailMark}>
              <Image
                src="/logo.png"
                alt="MUTX"
                width={32}
                height={32}
                className={styles.brandMark}
              />
            </span>
            <span className={styles.publicRailWord}>MUTX</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
