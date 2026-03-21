import Link from "next/link";
import { ArrowRight, BookOpen, MonitorPlay } from "lucide-react";

import { AuthSurface } from "@/components/site/AuthSurface";

type AuthHoldScreenProps = {
  mode: "login" | "register";
};

export function AuthHoldScreen({ mode }: AuthHoldScreenProps) {
  const title =
    mode === "login"
      ? "Hosted sign-in is still under lock."
      : "Public sign-up stays closed for now.";

  const description =
    mode === "login"
      ? "The hosted auth lane is still being tightened. MUTX is already usable through the dashboard surface, docs, install flow, CLI, and TUI while that work finishes."
      : "We are not opening self-serve signup until the hosted operator flow stops needing caveats. The rest of the product is already visible, installable, and inspectable.";

  const highlights =
    mode === "login"
      ? [
          "Open the dashboard surface if you want to inspect the operator UI.",
          "Run the install path if you need a real local proof lane today.",
          "Use the docs when you want the route contract before anything else.",
        ]
      : [
          "Use the dashboard and docs to verify the current operator surface first.",
          "Use contact when you need a hosted evaluation or design-partner workflow.",
          "Use the install flow when you want the shortest path to a real runtime.",
        ];

  return (
    <AuthSurface
      eyebrow={mode === "login" ? "Auth lane paused" : "Access gate still closed"}
      title={title}
      description={description}
      asideEyebrow="Current reality"
      asideTitle="The product is ahead of the hosted auth wrapper."
      asideBody="MUTX already has a real public site, docs, dashboard surface, and local proof path. This page exists so the auth lane says the truth instead of pretending the hosted flow is ready when it is not."
      mediaSrc="/landing/webp/running-agent.webp"
      mediaAlt="MUTX robot in motion carrying the operator surface forward"
      mediaWidth={900}
      mediaHeight={900}
      highlights={highlights}
    >
      <div className="space-y-6">
        <div className="site-kicker">
          {mode === "login" ? "Use the live surfaces meanwhile" : "Use the public surfaces meanwhile"}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Inspect the current dashboard and operator layout.",
            "Run the quickstart and validate the route surface locally.",
            "Read the docs and repo before you commit to a flow.",
          ].map((item) => (
            <div key={item} className="site-inline-card">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="site-button-primary">
            Open dashboard
            <MonitorPlay className="h-4 w-4" />
          </Link>
          <Link href="/#install" className="site-button-secondary">
            Run quickstart
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://docs.mutx.dev"
            target="_blank"
            rel="noreferrer"
            className="site-button-muted"
          >
            Read docs
            <BookOpen className="h-4 w-4" />
          </a>
        </div>
      </div>
    </AuthSurface>
  );
}
