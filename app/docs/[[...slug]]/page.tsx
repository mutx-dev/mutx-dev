import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DocsRenderer, extractHeadings } from "@/components/site/docs/DocsRenderer";
import { JumpNav } from "@/components/site/docs/JumpNav";
import { DEFAULT_X_HANDLE, getCanonicalUrl } from "@/lib/seo";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function docsDir() {
  return path.join(process.cwd(), "docs");
}

function resolveSlug(slugSegments: string[]): string | null {
  // Special case: /docs/README -> docs/README.md (the index)
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
  const { slug = ["README"] } = await params;
  const filePath = resolveSlug(slug);
  if (!filePath) return { title: "Not Found" };

  const source = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(source);
  const title = (data.title as string) || (data.description as string) || "MUTX Docs";
  const normalizedPath = slug[0] === "README" ? "/docs" : `/docs/${slug.join("/")}`;
  const description = (data.description as string) || "Documentation for MUTX operators and builders.";

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

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = ["README"] } = await params;

  const filePath = resolveSlug(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);
  const headings = extractHeadings(content);

  return (
    <div>
      <JumpNav headings={headings} />
      <DocsRenderer source={content} />
      {data.icon && (
        <p className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
          Last updated via GitBook sync — source at{" "}
          <a
            href={`https://github.com/mutx-dev/mutx-dev/blob/main/${path.relative(process.cwd(), filePath)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            GitHub
          </a>
        </p>
      )}
    </div>
  );
}
