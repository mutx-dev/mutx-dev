"use client";

import Link from "next/link";
import { useReducedMotionPreference } from "@/lib/useReducedMotionPreference";
import { useEffect, useRef, useState } from "react";
import { Presentation, Settings2, X } from "lucide-react";

import styles from "@/components/dashboard/demo/controlDemo.module.css";
import {
  NAV_ITEMS,
  SECTION_META,
  type Metric,
} from "@/components/dashboard/demo/demoContent";
import {
  AgentsSection,
  DeploymentsSection,
  EnvironmentsSection,
  OverviewSection,
  PlaceholderSection,
  RunsSection,
} from "@/components/dashboard/demo/routeSections";
import type { DemoSection } from "@/components/dashboard/demo/demoSections";
import { DemoPanel, MetricCard, SearchBar } from "@/components/dashboard/demo/demoPrimitives";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function DemoStageHeader({ section }: { section: DemoSection }) {
  const meta = SECTION_META[section];
  const metrics: Metric[] = meta.heroStats.map((item) => ({
    label: item.label,
    value: item.value,
    meta: item.detail,
  }));

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageEyebrow}>MUTX / {meta.eyebrow}</p>
          <h1 className={styles.pageTitle}>{meta.title}</h1>
          <p className={styles.pageDescription}>{meta.detail}</p>
        </div>
      </header>
      {section === "overview" ? null : (
        <section className={styles.summaryGrid} aria-label={`${meta.eyebrow} summary`}>
          {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </section>
      )}
    </>
  );
}

function PresenterNotes({
  section,
  dialogRef,
  closeRef,
  onClose,
}: {
  section: DemoSection;
  dialogRef: React.RefObject<HTMLElement | null>;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const meta = SECTION_META[section];

  return (
    <div className={styles.dialogOverlay} data-testid="control-presenter-overlay">
      <aside
        id="control-presenter-panel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="control-presenter-title"
        className={styles.presenterPanel}
      >
        <header className={styles.presenterHeader}>
          <div className="min-w-0">
            <p className={`${styles.pageEyebrow} ${styles.presenterEyebrow}`}>{meta.eyebrow}</p>
            <h2 id="control-presenter-title" className={styles.presenterTitle}>Presenter notes</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={styles.presenterClose}
            aria-label="Close presenter notes"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className={styles.presenterBody}>
          <DemoPanel title="Opening thought" kicker={meta.eyebrow}>
            <p className={styles.presenterLead}>{meta.command}</p>
          </DemoPanel>
          <ol className={styles.presenterNotes}>
            {meta.narrative.map((item, index) => (
              <li className={styles.presenterNote} key={`${section}-note-${index}`}>{item}</li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function SectionContent({ section }: { section: DemoSection }) {
  if (section === "overview") return <OverviewSection />;
  if (section === "agents") return <AgentsSection />;
  if (section === "deployments") return <DeploymentsSection />;
  if (section === "runs") return <RunsSection />;
  if (section === "environments") return <EnvironmentsSection />;
  return <PlaceholderSection section={section} />;
}

export function MutxDemoApp({ section }: { section: DemoSection }) {
  const [demoNotice, setDemoNotice] = useState("");
  const [presenterOpen, setPresenterOpen] = useState(false);
  const prefersReducedMotion = useReducedMotionPreference();
  const appContentRef = useRef<HTMLDivElement>(null);
  const presenterTriggerRef = useRef<HTMLButtonElement>(null);
  const presenterDialogRef = useRef<HTMLElement>(null);
  const presenterCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!presenterOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : presenterTriggerRef.current;
    appContentRef.current?.setAttribute("inert", "");
    window.requestAnimationFrame(() => presenterCloseRef.current?.focus());

    const handlePresenterKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDemoNotice("Presenter notes closed.");
        setPresenterOpen(false);
        return;
      }

      if (event.key !== "Tab" || !presenterDialogRef.current) return;

      const focusable = Array.from(
        presenterDialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handlePresenterKeys);
    return () => {
      window.removeEventListener("keydown", handlePresenterKeys);
      appContentRef.current?.removeAttribute("inert");
      (previousFocus?.isConnected ? previousFocus : presenterTriggerRef.current)?.focus({
        preventScroll: true,
      });
    };
  }, [presenterOpen]);

  const openPresenter = () => {
    setDemoNotice("Presenter notes opened.");
    setPresenterOpen(true);
  };
  const closePresenter = () => {
    setDemoNotice("Presenter notes closed.");
    setPresenterOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="MUTX interactive control demo"
      data-testid="control-demo-root"
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-control-visual-system="operator-workspace"
      data-no-live-writes="true"
      className={styles.root}
    >
      <p
        className={styles.srOnly}
        data-testid="control-demo-announcement"
        role="status"
        aria-live="polite"
      >
        {demoNotice}
      </p>

      <div ref={appContentRef} className={styles.appContent}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <Link href="/control" className={styles.brand} aria-label="MUTX demo overview">
              <span className={styles.brandMark} aria-hidden="true">M</span>
              <span>
                <span className={styles.brandName}>MUTX</span>
                <span className={styles.brandCaption}>Control</span>
              </span>
            </Link>

            <div className={styles.searchDesktop}><SearchBar /></div>

            <div className={styles.headerControls}>
              <button
                ref={presenterTriggerRef}
                type="button"
                onClick={openPresenter}
                aria-label="Presenter"
                aria-expanded={presenterOpen}
                aria-controls="control-presenter-panel"
                className={styles.headerButton}
              >
                <Presentation className={styles.presenterIcon} aria-hidden="true" />
                <span className={styles.presenterLabel}>Presenter</span>
              </button>
              <Link
                href="/control/settings"
                aria-label="Open settings"
                className={styles.settingsLink}
              >
                <Settings2 aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.searchMobile}><SearchBar /></div>
        </header>

        <div className={styles.demoNotice} data-testid="control-demo-label">
          <span className={styles.noticeDot} aria-hidden="true" />
          <span>Demo · sample data · changes stay in this tab</span>
        </div>

        <div className={styles.workspace}>
          <aside className={styles.desktopNav}>
            <p className={styles.navEyebrow}>Workspace</p>
            <nav aria-label="Control demo navigation">
              <ul className={styles.navList}>
                {NAV_ITEMS.map((item) => {
                  const active = item.key === section;
                  return (
                    <li key={item.key}>
                      <Link href={item.href} aria-current={active ? "page" : undefined} className={styles.navLink}>
                        <item.icon className={styles.navIcon} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.navFooter}>
              <span className={styles.navFooterMark} aria-hidden="true" />
              <span>MUTX / Operations</span>
            </div>
          </aside>

          <div className={styles.workspaceColumn}>
            <nav className={styles.mobileNav} aria-label="Control demo sections">
              {NAV_ITEMS.map((item) => {
                const active = item.key === section;
                return (
                  <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} className={styles.mobileNavLink}>
                    <item.icon className={styles.mobileNavIcon} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <main id="main-content" className={styles.main}>
              <div className={styles.mainInner} data-testid="control-demo-stage">
                <DemoStageHeader section={section} />
                <SectionContent section={section} />
              </div>
            </main>
          </div>
        </div>
      </div>

      {presenterOpen ? (
        <PresenterNotes
          section={section}
          dialogRef={presenterDialogRef}
          closeRef={presenterCloseRef}
          onClose={closePresenter}
        />
      ) : null}
    </div>
  );
}
