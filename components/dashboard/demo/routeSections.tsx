import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  useControlDemoState,
  type ControlDemoDecision,
} from "@/components/dashboard/demo/ControlDemoState";
import styles from "@/components/dashboard/demo/controlDemo.module.css";
import {
  QUICK_ACTIONS,
  type Tone,
} from "@/components/dashboard/demo/demoContent";
import type { DemoSection } from "@/components/dashboard/demo/demoSections";
import {
  DemoPanel,
  DecisionExampleActions,
  QuickActionButton,
  StatusBadge,
} from "@/components/dashboard/demo/demoPrimitives";

const RUN_STEPS = [
  {
    label: "Request",
    title: "Request received",
    detail: "The sales research assistant started a vendor comparison.",
    active: false,
  },
  {
    label: "Tool call",
    title: "Search connected documents",
    detail: <code className={styles.technicalValue}>documents.search</code>,
    active: false,
  },
];

const RECENT_ACTIVITY = [
  {
    title: "Vendor comparison",
    detail: "Sales research assistant · 3 documents found",
    status: "Review needed",
    tone: "warning" as const,
  },
  {
    title: "Support answer draft",
    detail: "Support assistant · knowledge base search",
    status: "Completed",
    tone: "healthy" as const,
  },
  {
    title: "Weekly report",
    detail: "Research assistant · staging environment",
    status: "Completed",
    tone: "healthy" as const,
  },
];

function RecordRow({
  title,
  detail,
  meta,
  status,
  tone = "neutral",
}: {
  title: string;
  detail: string;
  meta?: string[];
  status?: string;
  tone?: Tone;
}) {
  return (
    <li className={styles.recordItem}>
      <div className={styles.recordMain}>
        <h3 className={styles.recordTitle}>{title}</h3>
        <p className={styles.recordDescription}>{detail}</p>
        {meta?.length ? (
          <div className={styles.recordMeta}>
            {meta.map((item) => <span key={`${title}-${item}`}>{item}</span>)}
          </div>
        ) : null}
      </div>
      {status ? (
        <div className={styles.recordAside}>
          <StatusBadge label={status} tone={tone} />
        </div>
      ) : null}
    </li>
  );
}

function RunTimeline({ decision }: { decision: ControlDemoDecision }) {
  const reviewStep = decision === "waiting"
    ? {
        label: "Review request",
        title: "Waiting for operator review",
        detail: "Example request: share the vendor summary with an external workspace.",
        active: true,
      }
    : {
        label: "Example decision",
        title: decision === "approved" ? "Approved in this tab" : "Declined in this tab",
        detail: "No tool call was run for this example.",
        active: true,
      };
  const steps = [...RUN_STEPS, reviewStep];

  return (
    <ol className={styles.timeline} aria-label="Selected run events">
      {steps.map((step) => (
        <li className={styles.timelineItem} key={step.label}>
          <span
            className={`${styles.timelineNode} ${step.active ? styles.timelineNodeActive : ""}`}
            aria-hidden="true"
          />
          <div>
            <p className={styles.timelineLabel}>{step.label}</p>
            <p className={styles.timelineTitle}>{step.title}</p>
            <p className={styles.timelineDescription}>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SelectedRun() {
  const { decision } = useControlDemoState();
  const decisionLabel = decision === "waiting"
    ? "Review needed"
    : decision === "approved"
      ? "Example approved"
      : "Example declined";

  return (
    <DemoPanel title="Selected run" kicker="Run review" meta="Production">
      <div className={styles.runTitleRow}>
        <div>
          <h3 className={styles.runTitle}>Compare three vendor proposals</h3>
          <p className={styles.runSubtitle}>Sales research assistant · Production</p>
        </div>
        <StatusBadge label={decisionLabel} tone={decision === "waiting" ? "warning" : "focus"} />
      </div>
      <RunTimeline decision={decision} />
    </DemoPanel>
  );
}

function DecisionPanel() {
  const { decision, notice, approve, decline, reset } = useControlDemoState();

  const decisionLabel = decision === "waiting"
    ? "Waiting for review"
    : decision === "approved"
      ? "Example approved"
      : "Example declined";

  return (
    <DemoPanel title="Decision required" kicker="Approval request" meta="Tool call" decision>
      <p className={styles.decisionLead}>Requested action</p>
      <h3 className={styles.decisionTitle}>Share the vendor summary</h3>
      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>Tool</dt>
          <dd><code className={styles.technicalValue}>documents.share</code></dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Destination</dt>
          <dd>External workspace</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Policy</dt>
          <dd>Operator review required</dd>
        </div>
      </dl>
      <div className={styles.decisionFooter}>
        <StatusBadge label={decisionLabel} tone={decision === "waiting" ? "warning" : "focus"} />
        <Link href="/control/runs" className={styles.inlineLink}>
          Open run history <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <p className={styles.decisionResult} data-testid="control-demo-decision-result" role="status" aria-live="polite">
        {notice}
      </p>
      <DecisionExampleActions
        onApprove={approve}
        onDecline={decline}
        onReset={reset}
      />
    </DemoPanel>
  );
}

function RecentActivity() {
  return (
    <DemoPanel title="Recent activity" kicker="Workspace" meta="Examples">
      <ul className={styles.activityList}>
        {RECENT_ACTIVITY.map((activity) => (
          <RecordRow
            key={activity.title}
            title={activity.title}
            detail={activity.detail}
            status={activity.status}
            tone={activity.tone}
          />
        ))}
      </ul>
    </DemoPanel>
  );
}

function QuickActions() {
  return (
    <DemoPanel title="Quick actions" kicker="Try an interaction" meta="Preview">
      <ul className={styles.actionList}>
        {QUICK_ACTIONS.map((action) => <QuickActionButton key={action.label} action={action} />)}
      </ul>
    </DemoPanel>
  );
}

export function OverviewSection() {
  return (
    <div className={styles.contentStack}>
      <div className={`${styles.runLayout} ${styles.overviewRunLayout}`}>
        <SelectedRun />
        <DecisionPanel />
      </div>
      <div className={styles.secondaryGrid}>
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
}

export function AgentsSection() {
  const agents = [
    { title: "Sales research assistant", detail: "Vendor research and document review", meta: ["Production", "Operator owned"], status: "Ready", tone: "healthy" as const },
    { title: "Support assistant", detail: "Drafts answers from the support knowledge base", meta: ["Staging", "Team owned"], status: "Ready", tone: "healthy" as const },
    { title: "Research assistant", detail: "Prepares weekly summaries for review", meta: ["Development", "Operator owned"], status: "Running", tone: "focus" as const },
    { title: "Release assistant", detail: "Checks deployment notes before promotion", meta: ["Production", "Team owned"], status: "Review needed", tone: "warning" as const },
  ];

  return (
    <DemoPanel title="Agent directory" kicker="Ownership and state" meta="4 agents">
      <ul className={styles.recordList}>
        {agents.map((agent) => <RecordRow key={agent.title} {...agent} />)}
      </ul>
    </DemoPanel>
  );
}

export function DeploymentsSection() {
  const deployments = [
    { title: "Sales research assistant", detail: "Version 1.4.2 · OpenClaw runtime", meta: ["Production", "eu-west"], status: "Ready", tone: "healthy" as const },
    { title: "Support assistant", detail: "Version 0.9.8 · LangChain runtime", meta: ["Staging", "eu-west"], status: "In review", tone: "warning" as const },
    { title: "Research assistant", detail: "Version 2.1.0 · OpenClaw runtime", meta: ["Development", "us-east"], status: "Ready", tone: "healthy" as const },
  ];

  return (
    <DemoPanel title="Deployment history" kicker="Release details" meta="3 releases">
      <ul className={styles.recordList}>
        {deployments.map((deployment) => <RecordRow key={deployment.title} {...deployment} />)}
      </ul>
    </DemoPanel>
  );
}

export function RunsSection() {
  const runs = [
    { title: "Compare three vendor proposals", detail: "Sales research assistant · Production", meta: ["Started 12 minutes ago", "3 events"], status: "Review needed", tone: "warning" as const },
    { title: "Draft a support response", detail: "Support assistant · Staging", meta: ["Completed 28 minutes ago", "5 events"], status: "Completed", tone: "healthy" as const },
    { title: "Prepare weekly report", detail: "Research assistant · Development", meta: ["Completed 1 hour ago", "4 events"], status: "Completed", tone: "healthy" as const },
  ];

  return (
    <div className={styles.contentStack}>
      <div className={`${styles.runLayout} ${styles.runsPageLayout}`}>
        <DemoPanel title="Recent runs" kicker="Run history" meta="3 runs">
          <ul className={styles.recordList}>
            {runs.map((run, index) => (
              <li className={styles.recordItem} key={run.title}>
                <div className={styles.recordMain}>
                  <h3 className={styles.recordTitle}>{run.title}</h3>
                  <p className={styles.recordDescription}>{run.detail}</p>
                  <div className={styles.recordMeta}>{run.meta.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
                <div className={styles.recordAside}>
                  {index === 0 ? <span className={styles.srOnly}>Selected run</span> : null}
                  <StatusBadge label={index === 0 ? "Selected" : run.status} tone={index === 0 ? "focus" : run.tone} />
                </div>
              </li>
            ))}
          </ul>
        </DemoPanel>
        <SelectedRun />
        <DecisionPanel />
      </div>
    </div>
  );
}

export function EnvironmentsSection() {
  const environments = [
    { name: "Production", eyebrow: "Customer workloads", summary: "External tools wait for operator review.", status: "Protected", tone: "healthy" as const, access: "Restricted", progress: "92%" },
    { name: "Staging", eyebrow: "Release checks", summary: "Test changes before promoting a deployment.", status: "Ready", tone: "focus" as const, access: "Team access", progress: "74%" },
    { name: "Development", eyebrow: "Sandbox", summary: "An isolated space for development runs.", status: "Available", tone: "neutral" as const, access: "Team access", progress: "58%" },
  ];

  return (
    <div className={styles.contentStack}>
      <DemoPanel title="Environment overview" kicker="Workspace boundaries" meta="3 environments">
        <div className={styles.environmentGrid}>
          {environments.map((environment) => (
            <article className={styles.environmentCard} key={environment.name}>
              <p className={styles.panelKicker}>{environment.eyebrow}</p>
              <h3 className={styles.environmentName}>{environment.name}</h3>
              <p className={styles.environmentSummary}>{environment.summary}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <StatusBadge label={environment.status} tone={environment.tone} />
                <span className={styles.panelMeta}>{environment.access}</span>
              </div>
              <div className={styles.progressTrack} aria-label={`${environment.name} capacity ${environment.progress}`} role="img">
                <span className={styles.progressFill} style={{ width: environment.progress, display: "block" }} />
              </div>
            </article>
          ))}
        </div>
      </DemoPanel>
      <DemoPanel title="Environment rules" kicker="At a glance">
        <ul className={styles.recordList}>
          <RecordRow title="External tools" detail="Require an operator decision in production." status="Review required" tone="warning" />
          <RecordRow title="Deployment target" detail="New releases start in staging for review." status="Staging first" tone="focus" />
          <RecordRow title="Development data" detail="Development work stays inside the sandbox." status="Isolated" tone="healthy" />
        </ul>
      </DemoPanel>
    </div>
  );
}

export function AccessSection() {
  const accessRecords = [
    { title: "Workspace owner", detail: "Full workspace configuration and access review", meta: ["2 members", "Owner role"], status: "Active", tone: "healthy" as const },
    { title: "Operator access", detail: "Run review, deployment review, and incident response", meta: ["4 members", "Operator role"], status: "Active", tone: "healthy" as const },
    { title: "Webhook delivery key", detail: "Credential value hidden · used for event delivery", meta: ["Rotated 2 days ago", "Integration scope"], status: "Review soon", tone: "warning" as const },
    { title: "Read-only access", detail: "View agents, runs, and audit history", meta: ["3 members", "Viewer role"], status: "Active", tone: "neutral" as const },
  ];

  return (
    <DemoPanel title="Access records" kicker="Roles and credentials" meta="4 records">
      <ul className={styles.recordList}>
        {accessRecords.map((record) => <RecordRow key={record.title} {...record} />)}
      </ul>
    </DemoPanel>
  );
}

export function ConnectorsSection() {
  const connectors = [
    { title: "Slack notifications", detail: "Sends selected workspace events to the operations channel", meta: ["Notifications", "Connected"], status: "Ready", tone: "healthy" as const },
    { title: "GitHub releases", detail: "Reads release metadata for deployment records", meta: ["Release source", "Connected"], status: "Ready", tone: "healthy" as const },
    { title: "Webhook delivery", detail: "Delivers approved events to an external endpoint", meta: ["Event delivery", "Key rotated 2 days ago"], status: "Check settings", tone: "warning" as const },
    { title: "Document search", detail: "Searches documents attached to the vendor comparison run", meta: ["Agent tool", "Production"], status: "Available", tone: "focus" as const },
  ];

  return (
    <DemoPanel title="Connected services" kicker="Destinations and tools" meta="4 services">
      <ul className={styles.recordList}>
        {connectors.map((connector) => <RecordRow key={connector.title} {...connector} />)}
      </ul>
    </DemoPanel>
  );
}

export function AuditSection() {
  const events = [
    { title: "Review requested", detail: "documents.share · Compare three vendor proposals", meta: ["Mara Rossi", "Today, 10:42"], status: "Waiting", tone: "warning" as const },
    { title: "Deployment promoted", detail: "Sales research assistant · Version 1.4.2", meta: ["Release operator", "Today, 09:18"], status: "Recorded", tone: "healthy" as const },
    { title: "Credential rotated", detail: "Webhook delivery key · Integration scope", meta: ["Workspace owner", "Yesterday, 16:10"], status: "Recorded", tone: "neutral" as const },
    { title: "Environment updated", detail: "Staging · Default deployment target", meta: ["Workspace owner", "Yesterday, 14:36"], status: "Recorded", tone: "neutral" as const },
  ];

  return (
    <DemoPanel title="Recent changes" kicker="Audit history" meta="4 records">
      <ul className={styles.auditList}>
        {events.map((event) => <RecordRow key={event.title} {...event} />)}
      </ul>
    </DemoPanel>
  );
}

export function UsageSection() {
  return (
    <div className={styles.contentStack}>
      <DemoPanel title="Budget overview" kicker="Monthly usage" meta="This month">
        <div className={styles.environmentGrid}>
          <article className={styles.environmentCard}>
            <p className={styles.panelKicker}>Infrastructure</p>
            <h3 className={styles.environmentName}>$1,730</h3>
            <p className={styles.environmentSummary}>Compute and workspace services this month.</p>
          </article>
          <article className={styles.environmentCard}>
            <p className={styles.panelKicker}>Model usage</p>
            <h3 className={styles.environmentName}>$970</h3>
            <p className={styles.environmentSummary}>Requests across connected agents.</p>
          </article>
          <article className={styles.environmentCard}>
            <p className={styles.panelKicker}>Budget remaining</p>
            <h3 className={styles.environmentName}>57%</h3>
            <p className={styles.environmentSummary}>Of the monthly allowance.</p>
            <div className={styles.progressTrack} role="img" aria-label="57 percent of the budget remains">
              <span className={styles.progressFill} style={{ width: "57%", display: "block" }} />
            </div>
          </article>
        </div>
      </DemoPanel>
      <DemoPanel title="Usage by category" kicker="Current period">
        <ul className={styles.recordList}>
          <RecordRow title="Compute" detail="Agent runtime and deployment capacity" status="$1,120" tone="neutral" />
          <RecordRow title="Workspace services" detail="Storage, logs, and event delivery" status="$610" tone="neutral" />
          <RecordRow title="Model requests" detail="Usage across connected providers" status="$970" tone="neutral" />
        </ul>
      </DemoPanel>
    </div>
  );
}

export function SettingsSection() {
  const settings = [
    { title: "Default environment", detail: "New deployments start in this environment.", status: "Staging" },
    { title: "External tool calls", detail: "An operator reviews calls that leave the workspace.", status: "Review required" },
    { title: "Run notifications", detail: "Send a notice when a run fails or needs review.", status: "On" },
    { title: "Deployment notifications", detail: "Send a notice when a release is ready to promote.", status: "On" },
  ];

  return (
    <DemoPanel title="Workspace defaults" kicker="Settings" meta="4 preferences">
      <ul className={styles.settingList}>
        {settings.map((setting) => (
          <li className={styles.settingItem} key={setting.title}>
            <div className={styles.recordMain}>
              <h3 className={styles.recordTitle}>{setting.title}</h3>
              <p className={styles.recordDescription}>{setting.detail}</p>
            </div>
            <span className={styles.settingValue}>{setting.status}</span>
          </li>
        ))}
      </ul>
    </DemoPanel>
  );
}

export function PlaceholderSection({ section }: { section: DemoSection }) {
  switch (section) {
    case "access":
      return <AccessSection />;
    case "connectors":
      return <ConnectorsSection />;
    case "audit":
      return <AuditSection />;
    case "usage":
      return <UsageSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return <div className={styles.srOnly}>No content is available for this section.</div>;
  }
}
