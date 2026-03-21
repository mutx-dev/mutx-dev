import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { ComingSoonButton } from "@/components/site/ComingSoonButton";
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
      ? "The hosted auth lane is still being tightened. MUTX is already usable through docs, install flow, CLI, and TUI while that work finishes."
      : "We are not opening self-serve signup until the hosted operator flow stops needing caveats. The docs, install path, and local proof lane are already visible and usable.";

  const highlights =
    mode === "login"
      ? [
          "Run the install path if you need a real local proof lane today.",
          "Use the docs when you want the route contract before anything else.",
          "Use contact when you need a hosted walkthrough before wider access opens.",
        ]
      : [
          "Use the docs to verify the current operator contract first.",
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
      asideBody="MUTX already has a real public site, docs, CLI, and local proof path. This page exists so the auth lane says the truth instead of pretending the hosted flow is ready when it is not."
      mediaSrc="/landing/webp/running-agent.webp"
      mediaAlt="MUTX robot in motion carrying the operator surface forward"
      mediaWidth={900}
      mediaHeight={900}
      highlights={highlights}
    >
      <div className="space-y-6">
        <div className="site-kicker">Use the public surfaces meanwhile</div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Run the quickstart and validate the route surface locally.",
            "Read the docs and repo before you commit to a flow.",
            "Use contact when you want a guided hosted walkthrough instead of guessing.",
          ].map((item) => (
            <div key={item} className="site-inline-card">
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <ComingSoonButton>Dashboard soon</ComingSoonButton>
          <Link href="/#install" className="site-button-primary">
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
