import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { DocsRenderer, extractHeadings } from "@/components/site/docs/DocsRenderer";
import { TableOfContents } from "@/components/site/docs/TableOfContents";
import { SectionLanding } from "@/components/site/docs/SectionLanding";
import { PrevNextNav } from "@/components/site/docs/PrevNextNav";
import {
  DEFAULT_X_HANDLE,
  buildPageMetadata,
  getCanonicalUrl,
  getSiteUrl,
} from "@/lib/seo";
import { type DocNavItem, getPublishedDocRoutes, parseSummary } from "@/lib/docs";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function docsDir() {
  return path.join(process.cwd(), "docs");
}

function isPublishedDocSlug(slugSegments: string[]): boolean {
  if (slugSegments.length === 0 || (slugSegments.length === 1 && slugSegments[0] === "README")) {
    return true;
  }

  const route = `/docs/${slugSegments.join("/")}`;
  return getPublishedDocRoutes().has(route);
}

// Root-level content directories (mirrored from repo root, not inside docs/)
const ROOT_CONTENT_DIRS = ["agents"];

function isRootContent(slugSegments: string[]): boolean {
  return slugSegments.length >= 1 && ROOT_CONTENT_DIRS.includes(slugSegments[0]);
}

function resolveRootContentSlug(slugSegments: string[]): string | null {
  if (!isRootContent(slugSegments)) return null;
  const dir = slugSegments[0];

  // 1+ segments: /docs/agents/mission-control-orchestrator
  // → check docs/agents/mission-control-orchestrator.md first
  if (slugSegments.length >= 2) {
    const subFile = path.join(process.cwd(), "docs", dir, slugSegments[1] + ".md");
    if (fs.existsSync(subFile)) return subFile;
    // Also try AGENT.md for agent subdirs that mirror from repo root
    const agentFile = path.join(process.cwd(), dir, slugSegments[1], "AGENT.md");
    if (fs.existsSync(agentFile)) return agentFile;
  }

  // Top-level: /docs/agents
  const candidates = [
    path.join(process.cwd(), dir, "README.md"),
    path.join(process.cwd(), dir, "index.md"),
    path.join(process.cwd(), "docs", dir, "README.md"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveSlug(slugSegments: string[]): string | null {
  // Root-level content (e.g. agents/README.md lives at /agents not /docs/agents)
  if (isRootContent(slugSegments)) {
    return resolveRootContentSlug(slugSegments);
  }
  if (hasUnsafeSlugSegment(slugSegments)) {
    return null;
  }

  const docsRoot = path.resolve(docsDir());

  if (slugSegments.length === 1 && slugSegments[0] === "README") {
    const rootReadme = path.join(docsRoot, "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  if (slugSegments.length === 0) {
    const rootReadme = path.join(docsRoot, "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  const candidates = [
    path.join(...slugSegments) + ".md",
    path.join(...slugSegments, "README.md"),
    path.join(...slugSegments, "index.md"),
  ];

  for (const candidate of candidates) {
    const fullPath = path.resolve(docsRoot, candidate);
    if (!fullPath.startsWith(`${docsRoot}${path.sep}`)) {
      continue;
    }

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // GitBook maps docs/api/* → /docs/* (api/ prefix is flattened)
  // e.g. /docs/reference → docs/api/reference.md
  // e.g. /docs/reference/authentication → docs/api/authentication.md
  // e.g. /docs/reference/index → docs/api/index.md (API Overview)
  const apiSegments = slugSegments[0] === "reference" ? slugSegments.slice(1) : slugSegments;
  const apiCandidates = [
    ...(apiSegments.length === 0 ? [path.join("api", "reference.md"), path.join("api", "index.md")] : []),
    path.join("api", ...apiSegments) + ".md",
    path.join("api", ...apiSegments, "README.md"),
    path.join("api", ...apiSegments, "index.md"),
    // Special case: /docs/X/index → serve docs/api/index.md
    path.join("api", slugSegments[0], "index.md"),
  ];

  for (const candidate of apiCandidates) {
    const fullPath = path.resolve(docsRoot, candidate);
    if (!fullPath.startsWith(`${docsRoot}${path.sep}`)) {
      continue;
    }
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function sourceSlugForDocsRenderer(filePath: string): string[] {
  const relative = path.relative(docsDir(), filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return [];
  return relative.replace(/\.md$/i, "").split(path.sep);
}

function hasUnsafeSlugSegment(slugSegments: string[]): boolean {
  return slugSegments.some(
    (segment) =>
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
  );
}

function extractPrimaryHeading(source: string): string | null {
  const match = source.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractLeadParagraph(source: string): string | null {
  const paragraphs = source
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    if (
      paragraph.startsWith("#") ||
      paragraph.startsWith(">") ||
      paragraph.startsWith("```") ||
      paragraph.startsWith("|") ||
      /^[-*]\s/.test(paragraph) ||
      /^\d+\.\s/.test(paragraph)
    ) {
      continue;
    }

    return paragraph
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return null;
}

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((keyword): keyword is string => typeof keyword === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return [];
}

function getDocSeoFields(data: Record<string, unknown>, content: string) {
  const title =
    (typeof data.title === "string" && data.title.trim()) ||
    extractPrimaryHeading(content) ||
    "MUTX Docs";
  const description =
    (typeof data.description === "string" && data.description.trim()) ||
    extractLeadParagraph(content) ||
    "Documentation for MUTX operators and builders.";
  const keywords = Array.from(
    new Set([
      "mutx docs",
      "ai agent control plane",
      "agent operations",
      ...normalizeKeywords(data.keywords),
    ]),
  );

  return {
    title,
    metaTitle: title.endsWith("MUTX Docs") ? title : `${title} — MUTX Docs`,
    description,
    keywords,
  };
}

function findNavTrail(
  items: DocNavItem[],
  route: string,
  trail: DocNavItem[] = [],
): DocNavItem[] | null {
  for (const item of items) {
    const nextTrail = [...trail, item];
    if (item.route === route) {
      return nextTrail;
    }

    const childTrail = findNavTrail(item.children, route, nextTrail);
    if (childTrail) {
      return childTrail;
    }
  }

  return null;
}

function getDocBreadcrumbs(route: string, fallbackTitle: string) {
  const navTrail = findNavTrail(parseSummary(), route) ?? [];
  const breadcrumbs = [{ name: "Docs", path: "/docs" }];

  for (const item of navTrail) {
    if (item.route === "/docs") {
      continue;
    }

    if (breadcrumbs.some((breadcrumb) => breadcrumb.path === item.route)) {
      continue;
    }

    breadcrumbs.push({ name: item.title, path: item.route });
  }

  if (breadcrumbs[breadcrumbs.length - 1]?.path !== route) {
    breadcrumbs.push({ name: fallbackTitle, path: route });
  }

  return breadcrumbs;
}

function buildDocStructuredData(options: {
  title: string;
  path: string;
  description: string;
  breadcrumbs: Array<{ name: string; path: string }>;
  dateModified?: string;
}) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "MUTX",
        url: siteUrl,
        sameAs: [`https://x.com/${DEFAULT_X_HANDLE.replace("@", "")}`],
      },
      {
        "@type": "SoftwareApplication",
        name: "MUTX",
        applicationCategory: "DeveloperApplication",
        description:
          "Source-available control plane for AI agent governance, deployment, and observability.",
        downloadUrl: `${siteUrl}/download`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "WebPage",
        "@id": `${getCanonicalUrl(options.path)}#webpage`,
        name: options.title,
        url: getCanonicalUrl(options.path),
        description: options.description,
        isPartOf: {
          "@type": "WebSite",
          name: "MUTX Docs",
          url: getCanonicalUrl("/docs"),
        },
        ...(options.dateModified ? { dateModified: options.dateModified } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: options.breadcrumbs.map((breadcrumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: breadcrumb.name,
          item: getCanonicalUrl(breadcrumb.path),
        })),
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  if (!isPublishedDocSlug(slug)) return { title: "Not Found" };
  const filePath = resolveSlug(slug);
  if (!filePath) return { title: "Not Found" };

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const normalizedPath =
    slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;
  const seo = getDocSeoFields(data, content);

  return {
    title: seo.metaTitle,
    description: seo.description,
    category: "documentation",
    keywords: seo.keywords,
    ...buildPageMetadata({
      title: seo.metaTitle,
      description: seo.description,
      path: normalizedPath,
      siteName: "MUTX Docs",
      badge: "DOCS",
    }),
  };
}

const FEATURED = [
  {
    title: "MUTX Quickstart",
    href: "/docs/quickstart",
    desc: "The shortest path to a working MUTX setup.",
  },
  {
    title: "Deployment Quickstart",
    href: "/docs/deployment/quickstart",
    desc: "Clone, configure, deploy.",
  },
  {
    title: "Architecture Overview",
    href: "/docs/architecture/overview",
    desc: "The system map.",
  },
  {
    title: "API Reference",
    href: "/docs/reference",
    desc: "Public contracts and endpoints.",
  },
  {
    title: "Python SDK",
    href: "/sdk",
    desc: "Build against MUTX in Python.",
  },
  {
    title: "Troubleshooting",
    href: "/docs/troubleshooting",
    desc: "Find and clear common failures.",
  },
];

const AREA_LABELS: Record<string, string> = {
  api: "API Reference",
  architecture: "Architecture",
  autonomy: "Autonomy",
  deployment: "Deployment",
  releases: "Releases",
  troubleshooting: "Troubleshooting",
};

function DocsHomePage() {
  const nav = parseSummary();
  const areas = nav.filter(
    (section) => section.children.length > 0 && section.route !== "/docs",
  );

  return (
    <div className="docs-article-layout">
      <div className="docs-article-main docs-home">
        <section className="docs-home-billboard">
          <div className="docs-home-billboard-copy">
            <p className="docs-home-kicker">Operator manual</p>
            <h1 className="docs-home-title">Know the system.</h1>
            <p className="docs-home-sub">Set up MUTX. Run agents. Clear failures.</p>
            <div className="docs-home-actions">
              <Link href="/docs/quickstart" className="docs-home-primary">
                Open MUTX quickstart
              </Link>
              <Link href="/docs/reference" className="docs-home-secondary">
                Read API reference
              </Link>
            </div>
          </div>

          <div className="docs-home-ledger">
            <p className="docs-home-ledger-label">Start here</p>
            {FEATURED.slice(0, 3).map((card, index) => (
              <Link key={card.href} href={card.href} className="docs-home-ledger-item">
                <span className="docs-home-ledger-index">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="docs-home-ledger-title">{card.title}</span>
                  <span className="docs-home-ledger-desc">{card.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="docs-home-areas">
          <div className="docs-home-section-heading">
            <p className="docs-home-kicker">By area</p>
            <h2 className="docs-home-section-title">Go by surface.</h2>
          </div>

          <div className="docs-home-area-list">
            {areas.map((section, index) => {
              const label = AREA_LABELS[section.slug] ?? section.title;

              return (
                <div key={section.slug} className="docs-home-area-block">
                  <div className="docs-home-area-meta">
                    <span className="docs-home-area-index">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="docs-home-area-title">{label}</h3>
                  </div>
                  <SectionLanding title="" children={section.children} />
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;

  // Empty slug → render the homepage
  // Also handle /docs/README which Next.js serves for docs/README.md
  if (slug.length === 0 || (slug.length === 1 && slug[0] === "README")) {
    return <DocsHomePage />;
  }

  if (!isPublishedDocSlug(slug)) {
    redirect("/docs");
  }

  const filePath = resolveSlug(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const headings = extractHeadings(content);
  const currentRoute = `/docs/${slug.join("/")}`;
  const seo = getDocSeoFields(data, content);
  const breadcrumbs = getDocBreadcrumbs(currentRoute, seo.title);
  const lastModified = fs.statSync(filePath).mtime.toISOString();
  const structuredData = buildDocStructuredData({
    title: seo.title,
    path: currentRoute,
    description: seo.description,
    breadcrumbs,
    dateModified: lastModified,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="docs-article-layout">
        <div className="docs-article-main">
          <DocsRenderer source={content} currentSlug={sourceSlugForDocsRenderer(filePath)} />
          <PrevNextNav currentRoute={currentRoute} />
        </div>
        <TableOfContents sourceHeadings={headings} />
      </div>
    </>
  );
}
