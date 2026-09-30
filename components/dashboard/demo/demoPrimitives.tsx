import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import styles from "@/components/dashboard/demo/controlDemo.module.css";
import {
  NAV_ITEMS,
  SECTION_META,
  type Metric,
  type QuickAction,
  type Tone,
} from "@/components/dashboard/demo/demoContent";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<Tone, string> = {
  healthy: styles.statusHealthy,
  warning: styles.statusWarning,
  critical: styles.statusCritical,
  focus: styles.statusFocus,
  neutral: "",
};

export function DemoPanel({
  title,
  kicker,
  meta,
  action,
  className,
  bodyClassName,
  children,
  decision = false,
}: {
  title: string;
  kicker?: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  decision?: boolean;
}) {
  return (
    <section className={cn(styles.panel, decision && styles.decisionPanel, className)}>
      <header className={styles.panelHeader}>
        <div className="min-w-0">
          {kicker ? <p className={styles.panelKicker}>{kicker}</p> : null}
          <h2 className={styles.panelTitle}>{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta ? <span className={styles.panelMeta}>{meta}</span> : null}
          {action}
        </div>
      </header>
      <div className={cn(styles.panelBody, bodyClassName)}>{children}</div>
    </section>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{metric.label}</span>
      <span className={styles.metricValue}>{metric.value}</span>
      <span className={styles.metricDetail}>{metric.meta}</span>
    </article>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn(styles.statusBadge, TONE_CLASSES[tone])}>
      {label}
    </span>
  );
}

export function QuickActionButton({ action }: { action: QuickAction }) {
  const [selected, setSelected] = useState(false);
  const statusId = useId();

  return (
    <li>
      <button
        type="button"
        onClick={() => setSelected(true)}
        aria-describedby={statusId}
        className={cn(styles.actionButton, selected && styles.actionSelected)}
      >
        <span className={styles.actionCopy}>
          <span className={styles.actionTitle}>{action.label}</span>
          <span className={styles.actionDetail}>
            {selected ? "Preview selected" : action.detail}
          </span>
        </span>
        <ArrowUpRight className={styles.actionIcon} aria-hidden="true" />
      </button>
      <span id={statusId} data-testid="control-demo-action-status" className={styles.srOnly} aria-live="polite">
        {selected ? `Preview selected: ${action.label}.` : `${action.label} is available as a preview.`}
      </span>
    </li>
  );
}

export function DecisionExampleActions({
  onApprove,
  onDecline,
  onReset,
}: {
  onApprove: () => void;
  onDecline: () => void;
  onReset: () => void;
}) {
  return (
    <div className={styles.decisionActions}>
      <button
        type="button"
        className={cn(styles.decisionAction, styles.approveAction)}
        onClick={onApprove}
      >
        Approve example
      </button>
      <button
        type="button"
        className={cn(styles.decisionAction, styles.declineAction)}
        onClick={onDecline}
      >
        Decline example
      </button>
      <button
        type="button"
        className={cn(styles.decisionAction, styles.resetAction)}
        onClick={onReset}
      >
        Reset example
      </button>
    </div>
  );
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const resultsId = useId();
  const resultsLabelId = useId();
  const hintId = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];

    return NAV_ITEMS.filter((item) => {
      const meta = SECTION_META[item.key];
      return [item.label, meta.eyebrow, meta.title, meta.detail]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    }).sort((left, right) =>
      Number(right.label.toLowerCase().includes(normalizedQuery))
      - Number(left.label.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery]);

  return (
    <div className={styles.searchBox}>
      <Search className={styles.searchIcon} aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            event.currentTarget.blur();
          }
        }}
        placeholder="Find a page"
        aria-label="Search demo pages"
        aria-describedby={hintId}
        aria-controls={normalizedQuery ? resultsId : undefined}
        role="searchbox"
        className={styles.searchInput}
      />
      <span id={hintId} className={styles.srOnly}>
        Search demo pages. Press Escape to clear.
      </span>
      {normalizedQuery ? (
        <div
          id={resultsId}
          role="region"
          data-testid="control-demo-search-results"
          aria-labelledby={resultsLabelId}
          className={styles.searchResults}
        >
          <p id={resultsLabelId} className={styles.searchResultsLabel}>Pages</p>
          <p className={styles.srOnly} role="status" aria-live="polite">
            {matches.length} {matches.length === 1 ? "page" : "pages"} found.
          </p>
          {matches.length > 0 ? (
            matches.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setQuery("")}
                className={styles.searchResult}
              >
                <span>{item.label}</span>
                <span className={styles.searchResultMeta}>{SECTION_META[item.key].eyebrow}</span>
              </Link>
            ))
          ) : (
            <p className={styles.searchNoResult}>No page matches “{query.trim()}”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
