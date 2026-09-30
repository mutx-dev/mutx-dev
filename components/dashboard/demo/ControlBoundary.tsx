import type { ReactNode } from "react";

import styles from "@/components/dashboard/demo/controlDemo.module.css";
import type { Tone } from "@/components/dashboard/demo/demoContent";
import { cn } from "@/lib/utils";

const STATE_TONE_CLASSES: Record<Tone, string> = {
  healthy: styles.statusHealthy,
  warning: styles.statusWarning,
  critical: styles.statusCritical,
  focus: styles.statusFocus,
  neutral: "",
};

export function ControlBoundary({
  kind,
  eyebrow,
  title,
  description,
  stateLabel,
  stateTone = "neutral",
  status,
  role,
  children,
}: {
  kind: "loading" | "error" | "not-found";
  eyebrow: string;
  title: string;
  description: string;
  stateLabel?: string;
  stateTone?: Tone;
  status?: ReactNode;
  role?: "alert";
  children?: ReactNode;
}) {
  const titleId = `control-${kind}-title`;

  return (
    <section role={role} className={styles.boundaryCard} aria-labelledby={titleId}>
      <header className={styles.boundaryHeader}>
        <div className={styles.boundaryBrand}>
          <span className={styles.brandMark} aria-hidden="true">M</span>
          <span>
            <span className={styles.brandName}>MUTX</span>
            <span className={styles.brandCaption}>Product Demo</span>
          </span>
        </div>
        {status ?? (stateLabel ? (
          <span className={cn(styles.statusBadge, STATE_TONE_CLASSES[stateTone])}>
            {stateLabel}
          </span>
        ) : null)}
      </header>

      <div className={styles.boundaryBody}>
        <p className={styles.boundaryEyebrow}>{eyebrow}</p>
        <h1 className={styles.boundaryTitle} id={titleId}>{title}</h1>
        <p className={styles.boundaryDescription}>{description}</p>
        {children}
      </div>
    </section>
  );
}
