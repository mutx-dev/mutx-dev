export type MarketingActionTone = "primary" | "secondary" | "ghost" | "utility";

export type MarketingActionLink = {
  label: string;
  href: string;
  external?: boolean;
  tone?: MarketingActionTone;
};

export type MarketingFooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type MarketingFooterCallout = {
  title: string;
  body: string;
  action: MarketingActionLink;
};

export type MarketingHomepage = {
  hero: {
    tagline: string;
    title: string;
    support: string;
    backgroundSrc: string;
    backgroundAlt: string;
    actions: MarketingActionLink[];
  };
  proofStrip: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{
      label: string;
      value: string;
    }>;
  };
  depthNarrative: {
    eyebrow: string;
    title: string;
    body: string;
    media: {
      posterSrc: string;
      alt: string;
      label: string;
    };
    steps: Array<{
      id: string;
      index: string;
      title: string;
      body: string;
      detail: string;
    }>;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    body: string;
    actions: MarketingActionLink[];
  };
};

const homepageActions: MarketingActionLink[] = [
  {
    label: "Download for Mac",
    href: "/download",
    tone: "primary",
  },
  {
    label: "Read release",
    href: "/releases",
    tone: "secondary",
  },
  {
    label: "Read docs",
    href: "https://docs.mutx.dev",
    external: true,
    tone: "ghost",
  },
  {
    label: "GitHub",
    href: "https://github.com/mutx-dev/mutx-dev",
    external: true,
    tone: "utility",
  },
];

export const marketingHomepage: MarketingHomepage = {
  hero: {
    tagline: "Signed. Notarized. Shipping now.",
    title: "Deploy. Govern. Share.",
    support:
      "Install the Mac operator app, move into the browser dashboard, and keep runtime, auth, traces, and release in one control plane.",
    backgroundSrc: "/landing/webp/victory-core.webp",
    backgroundAlt: "MUTX robot raising the MUTX mark inside a blue-lit control chamber",
    actions: homepageActions,
  },
  proofStrip: {
    eyebrow: "Why it matters",
    title: "The control plane starts when the demo ends.",
    body: "Identity, tools, and rollout need one operator surface teams can actually run.",
    items: [
      {
        label: "Shipping now",
        value: "Mac app, release lane, and stable dashboard.",
      },
      {
        label: "Explicit policy",
        value: "Runtime boundaries stay legible under pressure.",
      },
      {
        label: "Open source",
        value: "The control layer stays inspectable and yours.",
      },
    ],
  },
  depthNarrative: {
    eyebrow: "How it works",
    title: "Three moves from first run to governed release.",
    body: "Set the boundary, inspect the run, and ship from the same surface.",
    media: {
      posterSrc: "/landing/webp/wiring-bay.webp",
      alt: "MUTX control runtime wiring bay with the MUTX robot operating inside the control surface",
      label: "MUTX runtime surface",
    },
    steps: [
      {
        id: "define-boundary",
        index: "01",
        title: "Define the boundary.",
        body: "Keep identity, tool policy, and runtime access outside the agent.",
        detail: "No permission logic buried in prompts.",
      },
      {
        id: "run-with-receipts",
        index: "02",
        title: "Inspect each run.",
        body: "Prompts, tool calls, actions, and outcomes stay reviewable.",
        detail: "Execution stays inspectable under pressure.",
      },
      {
        id: "ship-through-one-surface",
        index: "03",
        title: "Release without switching surfaces.",
        body: "Move from local proving to governed rollout without rebuilding the path.",
        detail: "The control plane compounds instead of resetting.",
      },
    ],
  },
  finalCta: {
    eyebrow: "Take the controlled path",
    title: "Install the operator app.",
    body: "Start with the signed Mac release, then keep docs, downloads, and release history in one public lane.",
    actions: homepageActions,
  },
};

export const marketingPublicRailLinks: MarketingActionLink[] = [
  { label: "Download", href: "/download" },
  { label: "Releases", href: "/releases" },
  { label: "Docs", href: "https://docs.mutx.dev", external: true },
  { label: "GitHub", href: "https://github.com/mutx-dev/mutx-dev", external: true },
];

export const marketingFooterLinks: MarketingFooterLink[] = [
  { label: "Releases", href: "/releases" },
  { label: "Docs", href: "https://docs.mutx.dev", external: true },
  { label: "GitHub", href: "https://github.com/mutx-dev/mutx-dev", external: true },
  { label: "Download", href: "/download" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy-policy" },
];

export const marketingFooterCallout: MarketingFooterCallout = {
  title: "OPEN CONTROL. SHIP CLEANLY.",
  body: "Download the operator app, read the docs, or inspect the source.",
  action: {
    label: "Download for Mac",
    href: "/download",
    tone: "primary",
  },
};
