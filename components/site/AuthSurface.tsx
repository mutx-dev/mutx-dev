import Image from "next/image";
import type { ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";

type AuthSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideEyebrow: string;
  asideTitle: string;
  asideBody: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaWidth: number;
  mediaHeight: number;
  highlights: readonly string[];
  children: ReactNode;
};

export function AuthSurface({
  eyebrow,
  title,
  description,
  asideEyebrow,
  asideTitle,
  asideBody,
  mediaSrc,
  mediaAlt,
  mediaWidth,
  mediaHeight,
  highlights,
  children,
}: AuthSurfaceProps) {
  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage}`}>
      <AuthNav />

      <main className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={`${styles.shell} ${styles.routeGrid}`}>
            <div className={`${styles.routeMain} ${styles.routeHeroCopy}`}>
              <div className={styles.intro}>
                <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>{eyebrow}</p>
                <h1 className={`${styles.displayTitle} ${styles.darkText}`}>{title}</h1>
                <p className={`${styles.bodyText} ${styles.bodyTextOnDark}`}>{description}</p>
              </div>
            </div>

            <aside className={styles.routeAside}>
              <div className={styles.routeVisualFrame}>
                <div className={styles.routeVisualGlow} aria-hidden="true" />
                <Image
                  src={mediaSrc}
                  alt={mediaAlt}
                  width={mediaWidth}
                  height={mediaHeight}
                  sizes="(max-width: 1024px) 100vw, 34rem"
                  className={styles.routeVisualImage}
                />
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.routeLightSection} data-route-surface="light">
          <div className={`${styles.shell} ${styles.routeGrid}`}>
            <div className={styles.routeMain}>
              <div className={`${styles.panel} ${styles.panelPadded} ${styles.routeFormPanel}`}>
                {children}
              </div>
            </div>

            <aside className={styles.routeAside}>
              <div className={`${styles.panel} ${styles.panelPadded} ${styles.routeInfoPanel}`}>
                <div className={styles.intro}>
                  <p className={styles.eyebrow}>{asideEyebrow}</p>
                  <h2 className={styles.sectionTitle}>{asideTitle}</h2>
                  <p className={styles.bodyText}>{asideBody}</p>
                </div>

                <div className={styles.surfaceList}>
                  {highlights.map((item) => (
                    <div key={item} className={styles.surfaceListItem}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicSurface>
  );
}
