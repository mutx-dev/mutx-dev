import type { ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";

import styles from "./AuthSurface.module.css";

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
  variant?: "access" | "recovery";
  hostVariant?: "default" | "pico";
};

export function AuthSurface({
  eyebrow,
  title,
  description,
  children,
  variant = "access",
  hostVariant = "default",
}: AuthSurfaceProps) {
  return (
    <PublicSurface className="site-page">
      <AuthNav hostVariant={hostVariant} />

      <main id="main-content" className={styles.main} data-auth-variant={variant} data-auth-host={hostVariant}>
        <section className={styles.stage}>
          <div className={styles.visual}>
            <div className={styles.letterGrid} aria-hidden="true">
              <span>M</span><span>U</span><span>T</span><span>X</span>
            </div>
            <div className={styles.visualContent}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>
          </div>

          <div className={styles.formPanel}>
            <div className={styles.formInner}>
              {children}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
