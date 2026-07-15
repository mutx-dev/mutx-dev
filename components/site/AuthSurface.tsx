import Image from "next/image";
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
  asideEyebrow,
  asideTitle,
  asideBody,
  mediaSrc,
  mediaAlt,
  mediaWidth,
  mediaHeight,
  highlights,
  children,
  variant = "access",
  hostVariant = "default",
}: AuthSurfaceProps) {
  const isPicoPreview = hostVariant === "pico";

  return (
    <PublicSurface className="site-page">
      <AuthNav hostVariant={hostVariant} />

      <main className={styles.main} data-auth-variant={variant}>
        <section className={styles.stage}>
          <div className={styles.visual}>
            <Image
              src={mediaSrc}
              alt={mediaAlt}
              width={mediaWidth}
              height={mediaHeight}
              sizes="(max-width: 980px) 100vw, 58vw"
              className={styles.image}
              priority
            />
            <div className={styles.visualContent}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
              <div className={styles.aside}>
                <p className={styles.asideEyebrow}>{asideEyebrow}</p>
                <h2 className={styles.asideTitle}>{asideTitle}</h2>
                <p className={styles.asideBody}>{asideBody}</p>
              </div>
            </div>
          </div>

          <div className={styles.formPanel}>
            <div className={styles.formInner}>
              {children}
              <div className={styles.notes}>
                <p className={styles.noteLabel}>
                  {variant === "recovery" ? "Recovery" : isPicoPreview ? "Preview access" : "Account security"}
                </p>
                {highlights.map((item) => (
                  <div key={item} className={styles.note}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
