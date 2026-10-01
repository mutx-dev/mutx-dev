import Link from 'next/link'

import { ControlBoundary } from '@/components/dashboard/demo/ControlBoundary'
import styles from '@/components/dashboard/demo/controlDemo.module.css'

export default function ControlNotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-boundary-surface="control"
      data-boundary-kind="not-found"
      className={styles.boundaryRoot}
      aria-labelledby="control-not-found-title"
    >
      <ControlBoundary
        kind="not-found"
        eyebrow="Product demo"
        title="This demo page isn’t available."
        description="Choose Overview or Agents to continue."
        stateLabel="Page unavailable"
        stateTone="neutral"
      >
        <nav className={styles.boundaryActions} aria-label="Demo navigation">
          <Link
            href="/control"
            className={`${styles.boundaryPrimaryAction} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71834a]`}
          >
            Overview
          </Link>
          <Link
            href="/control/agents"
            className={`${styles.boundarySecondaryAction} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71834a]`}
          >
            Agents
          </Link>
        </nav>
      </ControlBoundary>
    </main>
  );
}
