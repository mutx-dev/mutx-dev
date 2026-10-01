import { ControlBoundary } from "@/components/dashboard/demo/ControlBoundary";
import styles from "@/components/dashboard/demo/controlDemo.module.css";

export default function ControlLoading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-boundary-surface="control"
      data-boundary-kind="loading"
      className={styles.boundaryRoot}
      aria-labelledby="control-loading-title"
    >
      <ControlBoundary
        kind="loading"
        eyebrow="Product demo"
        title="Opening the demo…"
        description="Preparing the selected page."
        status={(
          <span className={styles.boundaryStatus} role="status" aria-live="polite" aria-busy="true">
            <span
              aria-hidden="true"
              className={`${styles.boundaryStatusDot} motion-safe:animate-pulse motion-reduce:animate-none`}
            />
            Opening
          </span>
        )}
      />
    </main>
  );
}
