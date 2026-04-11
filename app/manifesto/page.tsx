import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, buildWebPageStructuredData, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/manifesto.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Manifesto"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/manifesto") },
    openGraph: {
      title: `${data.title || "Manifesto"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/manifesto"),
      images: [getPageOgImageUrl(`${data.title || "Manifesto"} — MUTX`, data.description as string, { path: "/manifesto" })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Manifesto"} — MUTX`,
      description: data.description as string,
      images: [getPageTwitterImageUrl(`${data.title || "Manifesto"} — MUTX`, data.description as string, { path: "/manifesto" })],
    },
  };
}

export default async function ManifestoPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/manifesto.md"), "utf-8");
  const { data, content } = matter(source);

  const structuredData = buildWebPageStructuredData({
    name: `${data.title || "Manifesto"} | MUTX`,
    path: "/manifesto",
    description: (data.description as string) || "",
  });

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Manifesto"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="docs-prose">
        <div
          dangerouslySetInnerHTML={{
            __html: String(await remark().use(remarkGfm).process(content)),
          }}
        />
      </article>
    </DocsLayout>
  );
}