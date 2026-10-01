import type { ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { PicoFooter } from "@/components/pico/PicoFooter";
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
  highlights: readonly string[];
  children: ReactNode;
  variant?: "access" | "recovery";
  hostVariant?: "default" | "pico";
};

export function AuthSurface({
  eyebrow,
  title,
  description,
  asideEyebrow,
  asideTitle,
  asideBody,
  highlights,
  children,
  variant = "access",
  hostVariant = "default",
}: AuthSurfaceProps) {
  const notes = highlights.slice(0, 3);

  return (
    <PublicSurface>
      <AuthNav hostVariant={hostVariant} />

      <main id="main-content" tabIndex={-1} className={styles.main} data-auth-variant={variant} data-auth-host={hostVariant}>
        <section className={styles.stage}>
          <aside className={styles.visual}>
            <div className={styles.visualContent}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>

            <ul className={styles.notes}>
              {notes.map((entry) => <li key={entry}>{entry}</li>)}
            </ul>

            <div className={styles.receipt}>
              <p>{asideEyebrow}</p>
              <strong>{asideTitle}</strong>
              <span>{asideBody}</span>
            </div>
          </aside>

          <div className={styles.formPanel}>
            <div className={styles.formInner}>
              {children}
            </div>
          </div>
        </section>
      </main>

      {hostVariant === "pico" ? <PicoFooter /> : <PublicFooter showCallout={false} />}
    </PublicSurface>
  );
}
