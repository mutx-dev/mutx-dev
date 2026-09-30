'use client'

import Link from 'next/link'

import { ControlBoundary } from '@/components/dashboard/demo/ControlBoundary'
import styles from '@/components/dashboard/demo/controlDemo.module.css'

export function ControlErrorFallback({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-boundary-surface="control"
      data-boundary-kind="error"
      className={styles.boundaryRoot}
      aria-labelledby="control-error-title"
    >
      <ControlBoundary
        kind="error"
        eyebrow="Product demo"
        title="We couldn’t open the demo."
        description="Try again, or return to the overview."
        stateLabel="Unavailable"
        stateTone="critical"
        role="alert"
      >
        <div className={styles.boundaryActions}>
          <button
            type="button"
            onClick={reset}
            className={`${styles.boundaryPrimaryAction} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71834a]`}
          >
            Retry
          </button>
          <Link
            href="/control"
            className={`${styles.boundarySecondaryAction} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71834a]`}
          >
            Overview
          </Link>
        </div>
      </ControlBoundary>
    </main>
  )
}
