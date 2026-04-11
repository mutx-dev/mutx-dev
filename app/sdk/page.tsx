import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, buildWebPageStructuredData, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";


export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/sdk.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "SDK"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/sdk") },
    openGraph: {
      title: `${data.title || "SDK"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/sdk"),
      images: [getPageOgImageUrl(`${data.title || "SDK"} — MUTX`, data.description as string, { path: "/sdk" })],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "SDK"} — MUTX`,
      description: data.description as string,
      images: [getPageTwitterImageUrl(`${data.title || "SDK"} — MUTX`, data.description as string, { path: "/sdk" })],
    },
  };
}

export default async function SDKPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/sdk.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "SDK"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebPageStructuredData({ name: `${data.title || "SDK"} | MUTX`, path: "/sdk", description: (data.description as string) || "" })) }}
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