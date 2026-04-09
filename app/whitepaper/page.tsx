import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl } from "@/lib/seo";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";

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
      images: [getOgImageUrl()],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Whitepaper"} — MUTX`,
      description: data.description as string,
      images: [getOgImageUrl()],
    },
  };
}

export default async function WhitepaperPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/whitepaper.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Whitepaper"}>
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
