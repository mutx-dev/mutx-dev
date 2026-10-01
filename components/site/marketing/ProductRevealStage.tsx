'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

import styles from './ProductRevealStage.module.css'

export function ProductRevealStage() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const wideViewport = window.matchMedia('(min-width: 821px)')
    const animatedProperties = [
      '--tilt-x',
      '--tilt-y',
      '--rise',
      '--object-scale',
      '--glint-offset',
      '--context-opacity',
      '--event-highlight',
      '--summary-opacity',
      '--summary-offset',
      '--screen-dim',
      '--sheet-x',
      '--sheet-y',
      '--sheet-z',
      '--sheet-opacity',
    ]
    let frame = 0
    let staticMode: boolean | undefined
    let lastProgress: number | null = null
    let lastPhase = track.dataset.phase ?? null
    let scrollListenersAttached = false

    const resetToStatic = () => {
      if (staticMode === true) return
      window.cancelAnimationFrame(frame)
      animatedProperties.forEach((property) => track.style.removeProperty(property))
      if (track.dataset.phase !== 'console') track.dataset.phase = 'console'
      lastProgress = null
      lastPhase = 'console'
      staticMode = true
    }

    const update = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        if (reducedMotion.matches || !wideViewport.matches) {
          resetToStatic()
          return
        }

        if (staticMode !== false) {
          staticMode = false
          lastProgress = null
        }

        const distance = Math.max(track.offsetHeight - window.innerHeight, 1)
        const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / distance))
        if (progress === lastProgress) return
        lastProgress = progress

        const smooth = (value: number) => {
          const t = Math.min(1, Math.max(0, value))
          return t * t * (3 - 2 * t)
        }
        const reveal = smooth(progress / 0.24)
        const detail = smooth((progress - 0.22) / 0.43)
        const approval = smooth((progress - 0.65) / 0.29)
        const screenDim = smooth((progress - 0.54) / 0.18)
        const sheetReveal = smooth((progress - 0.6) / 0.23)

        const phase = progress < 0.22 ? 'console' : progress < 0.65 ? 'run' : 'approval'
        if (phase !== lastPhase) {
          track.dataset.phase = phase
          lastPhase = phase
        }
        track.style.setProperty('--tilt-x', `${(10 * (1 - reveal)).toFixed(2)}deg`)
        track.style.setProperty('--tilt-y', `${(-34 * (1 - reveal)).toFixed(2)}deg`)
        track.style.setProperty('--rise', `${(34 * (1 - reveal) - 30 * detail).toFixed(1)}px`)
        track.style.setProperty('--object-scale', (0.88 + reveal * 0.12 + detail * 0.25 - approval * 0.1).toFixed(3))
        track.style.setProperty('--glint-offset', `${(-140 + reveal * 280).toFixed(1)}%`)
        track.style.setProperty('--context-opacity', (1 - detail * 0.3).toFixed(3))
        track.style.setProperty('--event-highlight', `rgba(215, 238, 131, ${(detail * 0.12).toFixed(3)})`)
        track.style.setProperty('--summary-opacity', (1 - detail * 0.92).toFixed(3))
        track.style.setProperty('--summary-offset', `${(-16 * detail).toFixed(1)}px`)
        track.style.setProperty('--screen-dim', (screenDim * 0.84).toFixed(3))
        track.style.setProperty('--sheet-x', `${(48 * (1 - approval)).toFixed(1)}%`)
        track.style.setProperty('--sheet-y', `${(25 * (1 - approval)).toFixed(1)}px`)
        track.style.setProperty('--sheet-z', `${(85 * approval).toFixed(1)}px`)
        track.style.setProperty('--sheet-opacity', sheetReveal.toFixed(3))
      })
    }

    const syncMode = () => {
      const shouldAnimate = wideViewport.matches && !reducedMotion.matches
      if (!shouldAnimate) {
        if (scrollListenersAttached) {
          window.removeEventListener('scroll', update)
          window.removeEventListener('resize', update)
          scrollListenersAttached = false
        }
        resetToStatic()
        return
      }

      if (staticMode !== false) {
        staticMode = false
        lastProgress = null
      }
      if (!scrollListenersAttached) {
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        scrollListenersAttached = true
      }
      update()
    }

    wideViewport.addEventListener('change', syncMode)
    reducedMotion.addEventListener('change', syncMode)
    syncMode()

    return () => {
      if (scrollListenersAttached) {
        window.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
      }
      wideViewport.removeEventListener('change', syncMode)
      reducedMotion.removeEventListener('change', syncMode)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={trackRef} className={styles.track} data-phase="console">
      <div className={styles.pin}>
        <div className={styles.content}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>MUTX / Agent operations</p>
            <h1 id="home-title">Inspect runs. Control tool calls.</h1>
            <p className={styles.lede}>
              Follow an agent request from its first event to the decision to let a tool run.
            </p>
            <div className={styles.actions}>
              <Link href="/control" className={styles.primaryAction}>
                Explore the demo <ArrowRight className="rtl-directional-icon" aria-hidden="true" />
              </Link>
              <Link href="/docs/deployment/quickstart" className={styles.secondaryAction}>
                Read the quickstart
              </Link>
            </div>
            <p className={styles.scrollCue} aria-hidden="true">
              <span /> Scroll to inspect an example run
            </p>
          </div>

          <div className={styles.objectStage} aria-hidden="true">
            <div className={styles.halo} aria-hidden="true" />
            <figure className={styles.console}>
              <div className={styles.consoleEdge} aria-hidden="true">
                <span />
              </div>
              <div className={styles.screen}>
                <div className={styles.screenTop}>
                  <div className={styles.screenBrand}>
                    <span aria-hidden="true">M</span>
                    <strong>MUTX</strong>
                    <span className={styles.screenDivider} aria-hidden="true" />
                    <span className={styles.screenArea}>Run review</span>
                  </div>
                  <span className={styles.exampleBadge}>Example run</span>
                </div>

                <div className={styles.runSummary}>
                  <span className={styles.runType}>Agent request</span>
                  <h2>Compare three vendor proposals</h2>
                  <p>Request submitted by the connected agent.</p>
                </div>

                <ol className={styles.runEvents}>
                  <li>
                    <div className={styles.eventLine}>
                      <span className={styles.eventDot} aria-hidden="true" />
                      <span>Run event</span>
                    </div>
                    <strong>Request received</strong>
                  </li>
                  <li>
                    <div className={styles.eventLine}>
                      <span className={styles.eventDot} aria-hidden="true" />
                      <span>Tool call</span>
                    </div>
                    <strong><code data-technical-value>documents.search</code></strong>
                  </li>
                  <li className={styles.pendingEvent}>
                    <div className={styles.eventLine}>
                      <span className={styles.eventDot} aria-hidden="true" />
                      <span>Approval</span>
                    </div>
                    <strong><code data-technical-value>documents.share</code></strong>
                    <span className={styles.pendingLabel}>Review requested</span>
                  </li>
                </ol>

                <div className={styles.screenFoot}>
                  <span>Request context</span>
                  <span>Policy decision</span>
                  <span>Outcome</span>
                </div>
              </div>
              <div className={styles.approvalSheet} data-testid="home-approval-preview">
                <div className={styles.sheetHeader}>
                  <span>Approval request</span>
                  <span>Example</span>
                </div>
                <p className={styles.sheetLabel}>Requested action</p>
                <h2>Share the vendor summary</h2>
                <dl>
                  <div>
                    <dt>Tool</dt>
                    <dd><code data-technical-value>documents.share</code></dd>
                  </div>
                  <div>
                    <dt>Destination</dt>
                    <dd>External workspace</dd>
                  </div>
                  <div>
                    <dt>Decision</dt>
                    <dd>Operator review required</dd>
                  </div>
                </dl>
              </div>
            </figure>
            <div className={styles.phaseLabels} aria-hidden="true">
              <span data-scene="console">01 / Console</span>
              <span data-scene="run">02 / Run detail</span>
              <span data-scene="approval">03 / Approval</span>
            </div>

            <div className={styles.mobileConsole}>
              <div className={styles.mobileScreen}>
                <div className={styles.mobileHeader}>
                  <span>Example run</span>
                  <span>Agent activity</span>
                </div>
                <h2>Compare three vendor proposals</h2>
                <ol className={styles.mobileEvents}>
                  <li>
                    <span>01 <i aria-hidden="true" /></span>
                    <div>
                      <strong>Request received</strong>
                      <p>The connected agent submitted a request.</p>
                    </div>
                  </li>
                  <li>
                    <span>02 <i aria-hidden="true" /></span>
                    <div>
                      <strong>Tool call</strong>
                      <code data-technical-value>documents.search</code>
                    </div>
                  </li>
                </ol>
                <div className={styles.mobileApprovalCard}>
                  <div className={styles.mobileApprovalHeader}>
                    <span>Approval request</span>
                    <span>Example</span>
                  </div>
                  <h3>Share the vendor summary</h3>
                  <dl>
                    <div>
                      <dt>Tool</dt>
                      <dd><code data-technical-value>documents.share</code></dd>
                    </div>
                    <div>
                      <dt>Destination</dt>
                      <dd>External workspace</dd>
                    </div>
                  </dl>
                  <p><span aria-hidden="true" /> Operator review required before the call runs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
