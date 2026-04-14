import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { DocsRenderer, extractHeadings } from "@/components/site/docs/DocsRenderer";
import { TableOfContents } from "@/components/site/docs/TableOfContents";
import { SectionLanding } from "@/components/site/docs/SectionLanding";
import { PrevNextNav } from "@/components/site/docs/PrevNextNav";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";
import { parseSummary, resolveDocFileFromSlug } from "@/lib/docs";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const filePath = resolveDocFileFromSlug(slug);
  if (!filePath) return { title: "Not Found" };

  const source = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(source);
  const title =
    (data.title as string) || (data.description as string) || "MUTX Docs";
  const normalizedPath =
    slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;
  const description =
    (data.description as string) ||
    "Documentation for MUTX operators and builders.";

  return {
    title: `${title} — MUTX Docs`,
    description,
    alternates: {
      canonical: getCanonicalUrl(normalizedPath),
    },
    openGraph: {
      title: `${title} — MUTX Docs`,
      description,
      url: getCanonicalUrl(normalizedPath),
      images: [getPageOgImageUrl(`${title} — MUTX Docs`, description, { path: normalizedPath })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${title} — MUTX Docs`,
      description,
      images: [getPageTwitterImageUrl(`${title} — MUTX Docs`, description, { path: normalizedPath })],
    },
  };
}

const FEATURED = [
  {
    title: "Quickstart",
    href: "/docs/deployment/quickstart",
    desc: "Get from clone to a working stack with the shortest validated path.",
  },
  {
    title: "API Reference",
    href: "/docs/reference",
    desc: "Read the live /v1/* contract, auth model, and public resource docs.",
  },
  {
    title: "Platform Architecture",
    href: "/docs/architecture",
    desc: "Understand the shape behind app, backend, CLI, SDK, and infra.",
  },
  {
    title: "v1.4 Release Notes",
    href: "/docs/v1.4",
    desc: "Current public release posture, supported surfaces, and download path.",
  },
  {
    title: "Troubleshooting",
    href: "/docs/troubleshooting",
    desc: "Recover quickly when local setup, auth, or route assumptions drift.",
  },
];

const AREA_LABELS: Record<string, string> = {
  api: "API Reference",
  architecture: "Architecture",
  autonomy: "Autonomy",
  deployment: "Deployment",
  releases: "Releases",
  troubleshooting: "Troubleshooting",
  agents: "Agents",
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
            <p className="docs-home-kicker">Field manual</p>
            <h1 className="docs-home-title">Read MUTX like a shipped system, not a static help center.</h1>
            <p className="docs-home-sub">
              This is the code-accurate route into setup, platform references, and operator
              behavior. Start with one guided entry point, then move through the product by area.
            </p>
            <div className="docs-home-actions">
              <Link href="/docs/deployment/quickstart" className="docs-home-primary">
                Open quickstart
              </Link>
              <Link href="/docs/reference" className="docs-home-secondary">
                Read API reference
              </Link>
            </div>
          </div>

          <div className="docs-home-ledger">
            <p className="docs-home-ledger-label">Manual index</p>
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

        <section className="docs-home-featured">
          <div className="docs-home-section-heading">
            <p className="docs-home-kicker">Entry points</p>
            <h2 className="docs-home-section-title">Start from the shortest meaningful route.</h2>
          </div>
          <div className="docs-home-featured-list">
            {FEATURED.map((card) => (
              <Link key={card.href} href={card.href} className="docs-home-featured-item">
                <span className="docs-home-featured-title">{card.title}</span>
                <span className="docs-home-featured-desc">{card.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="docs-home-areas">
          <div className="docs-home-section-heading">
            <p className="docs-home-kicker">By area</p>
            <h2 className="docs-home-section-title">Move through the platform one surface at a time.</h2>
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
                  <SectionLanding title={label} children={section.children} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="docs-home-appendix">
          <div className="docs-home-section-heading">
            <p className="docs-home-kicker">Truth rules</p>
            <h2 className="docs-home-section-title">When docs drift, trust the executable system.</h2>
          </div>
          <p className="docs-home-truth">
            Source of truth order: <code>src/api/routes/</code> for backend behavior,{" "}
            <code>app/api/</code> for browser-facing proxy behavior, <code>app/</code> for site
            and app surfaces, <code>cli/</code> for terminal workflows, and{" "}
            <code>sdk/mutx/</code> for SDK behavior.
          </p>
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

  const filePath = resolveDocFileFromSlug(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const headings = extractHeadings(content);
  const currentRoute = `/docs/${slug.join("/")}`;

  return (
    <div className="docs-article-layout">
      <div className="docs-article-main">
        <DocsRenderer source={content} currentSlug={slug} />
        <PrevNextNav currentRoute={currentRoute} />
        {data.icon && (
          <p className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
            Last updated via GitBook sync — source at{" "}
            <a
              href={`https://github.com/mutx-dev/mutx-dev/blob/main/${path.relative(
                process.cwd(),
                filePath
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              GitHub
            </a>
          </p>
        )}
      </div>
      <TableOfContents sourceHeadings={headings} />
    </div>
  );
}
