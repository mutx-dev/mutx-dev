import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, buildWebPageStructuredData, getCanonicalUrl, getPageOgImageUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "support.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Support"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/support") },
    openGraph: {
      title: `${data.title || "Support"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/support"),
      images: [getPageOgImageUrl(`${data.title || "Support"} — MUTX`, data.description as string, { path: "/support" })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Support"} — MUTX`,
      description: data.description as string,
      images: [getPageOgImageUrl(`${data.title || "Support"} — MUTX`, data.description as string, { path: "/support" })],
    },
  };
}

export default async function SupportPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "support.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Support"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebPageStructuredData({ name: `${data.title || "Support"} | MUTX`, path: "/support", description: (data.description as string) || "" })) }}
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