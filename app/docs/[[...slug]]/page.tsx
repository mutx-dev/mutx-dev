import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { DocsRenderer, extractHeadings } from "@/components/site/docs/DocsRenderer";
import { TableOfContents } from "@/components/site/docs/TableOfContents";
import { SectionLanding } from "@/components/site/docs/SectionLanding";
import { DEFAULT_X_HANDLE, getCanonicalUrl } from "@/lib/seo";
import { parseSummary } from "@/lib/docs";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function docsDir() {
  return path.join(process.cwd(), "docs");
}

// Root-level content directories (mirrored from repo root, not inside docs/)
const ROOT_CONTENT_DIRS = ["agents"];

function isRootContent(slugSegments: string[]): boolean {
  return (
    slugSegments.length === 1 && ROOT_CONTENT_DIRS.includes(slugSegments[0])
  );
}

function resolveRootContentSlug(slugSegments: string[]): string | null {
  if (!isRootContent(slugSegments)) return null;
  const dir = slugSegments[0];
  const candidates = [
    path.join(process.cwd(), dir, "README.md"),
    path.join(process.cwd(), dir, "index.md"),
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

  if (slugSegments.length === 1 && slugSegments[0] === "README") {
    const rootReadme = path.join(docsDir(), "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  if (slugSegments.length === 0) {
    const rootReadme = path.join(docsDir(), "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  const candidates = [
    path.join(...slugSegments) + ".md",
    path.join(...slugSegments, "README.md"),
    path.join(...slugSegments, "index.md"),
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(docsDir(), candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const filePath = resolveSlug(slug);
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
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${title} — MUTX Docs`,
      description,
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
    href: "/docs/api",
    desc: "Read the live /v1/* contract, auth model, and public resource docs.",
  },
  {
    title: "Platform Architecture",
    href: "/docs/architecture",
    desc: "Understand the shape behind app, backend, CLI, SDK, and infra.",
  },
  {
    title: "v1.3 Release Notes",
    href: "/docs/releases/v1.3",
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

  return (
    <div className="docs-article-layout">
      <div className="docs-article-main docs-home">
        <div className="docs-home-hero">
          <h1 className="docs-home-title">Documentation Hub</h1>
          <p className="docs-home-sub">
            Best entry point for setup, platform references, and operator docs.
            Use this section when you want the code-accurate view of setup, runtime
            surfaces, and current gaps.
          </p>
        </div>

        <div className="docs-home-cards">
          {FEATURED.map((card) => (
            <Link key={card.href} href={card.href} className="docs-home-card">
              <span className="docs-home-card-title">{card.title}</span>
              <span className="docs-home-card-desc">{card.desc}</span>
            </Link>
          ))}
        </div>

        <div className="docs-home-sections">
          <h2 className="docs-home-section-title">By Area</h2>
          {nav.map((section) => {
            const label =
              AREA_LABELS[section.slug] ?? section.title;
            if (section.children.length === 0) return null;

            return (
              <div key={section.slug} className="docs-home-section">
                <SectionLanding
                  title={label}
                  children={section.children}
                />
              </div>
            );
          })}
        </div>

        <div className="docs-home-truth-rules">
          <h2 className="docs-home-section-title">Truth rules</h2>
          <p className="docs-home-truth">
            When docs and code disagree, trust the code. Source of truth order:{" "}
            <code>src/api/routes/</code> for backend behavior,{" "}
            <code>app/api/</code> for browser-facing proxy behavior,{" "}
            <code>app/</code> for site and app surfaces, <code>cli/</code> for
            terminal workflows, <code>sdk/mutx/</code> for SDK behavior.
          </p>
        </div>
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
  if (slug.length === 0) {
    return <DocsHomePage />;
  }

  const filePath = resolveSlug(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const headings = extractHeadings(content);

  return (
    <div className="docs-article-layout">
      <div className="docs-article-main">
        <TableOfContents sourceHeadings={headings} />
        <DocsRenderer source={content} />
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
    </div>
  );
}
