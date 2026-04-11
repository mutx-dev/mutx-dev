import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, buildWebPageStructuredData, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";


export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "security.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Security"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/security") },
    openGraph: {
      title: `${data.title || "Security"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/security"),
      images: [getPageOgImageUrl(`${data.title || "Security"} — MUTX`, data.description as string, { path: "/security" })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Security"} — MUTX`,
      description: data.description as string,
      images: [getPageTwitterImageUrl(`${data.title || "Security"} — MUTX`, data.description as string, { path: "/security" })],
    },
  };
}

export default async function SecurityPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "security.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Security"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebPageStructuredData({ name: `${data.title || "Security"} | MUTX`, path: "/security", description: (data.description as string) || "" })) }}
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