import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, buildWebPageStructuredData, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";


export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/whitepaper.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Whitepaper"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/whitepaper") },
    openGraph: {
      title: `${data.title || "Whitepaper"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/whitepaper"),
      images: [getPageOgImageUrl(`${data.title || "Whitepaper"} — MUTX`, data.description as string, { path: "/whitepaper" })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Whitepaper"} — MUTX`,
      description: data.description as string,
      images: [getPageTwitterImageUrl(`${data.title || "Whitepaper"} — MUTX`, data.description as string, { path: "/whitepaper" })],
    },
  };
}

export default async function WhitepaperPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/whitepaper.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Whitepaper"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebPageStructuredData({ name: `${data.title || "Whitepaper"} | MUTX`, path: "/whitepaper", description: (data.description as string) || "" })) }}
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
