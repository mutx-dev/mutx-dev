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
    label: "Releases",
    href: "/releases",
    tone: "secondary",
  },
  {
    label: "Docs",
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
    support: "The open control plane for deployed agents.",
    backgroundSrc: "/landing/webp/victory-core.webp",
    backgroundAlt: "MUTX robot raising the MUTX mark inside a blue-lit control chamber",
    actions: homepageActions,
  },
  proofStrip: {
    eyebrow: "What ships now",
    title: "Production needs control.",
    body: "MUTX keeps access explicit, release paths visible, and the operator lane public.",
    items: [
      {
        label: "Source-available",
        value: "The control layer stays inspectable and yours.",
      },
      {
        label: "Signed Mac app",
        value: "Apple Silicon and Intel builds ship now.",
      },
      {
        label: "Public release lane",
        value: "Downloads, notes, docs, and checksums stay aligned.",
      },
    ],
  },
  depthNarrative: {
    eyebrow: "How it works",
    title: "Policy first. Access explicit. Every run reviewable.",
    body: "Define the boundary, inspect the run, and release from the same lane.",
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
        body: "Keep identity, tools, and runtime access outside the agent.",
        detail: "Policy stays explicit.",
      },
      {
        id: "run-with-receipts",
        index: "02",
        title: "Inspect the run.",
        body: "Prompts, tool calls, and outcomes stay reviewable.",
        detail: "Nothing critical is buried.",
      },
      {
        id: "ship-through-one-surface",
        index: "03",
        title: "Ship from the same lane.",
        body: "Move from local proof to governed release without rebuilding the path.",
        detail: "Release stays legible.",
      },
    ],
  },
  finalCta: {
    eyebrow: "Start here",
    title: "Install the Mac app.",
    body: "Start with the signed build, then keep docs, notes, and source aligned.",
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
  title: "SOURCE-AVAILABLE CONTROL FOR AGENTS.",
  body: "Start with the Mac app. Keep docs, notes, and source aligned.",
  action: {
    label: "Download for Mac",
    href: "/download",
    tone: "primary",
  },
};
