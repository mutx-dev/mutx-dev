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
  const source = fs.readFileSync(path.join(process.cwd(), "roadmap.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Roadmap"} — MUTX`,
    description: data.description as string,
    alternates: { canonical: getCanonicalUrl("/roadmap") },
    openGraph: {
      title: `${data.title || "Roadmap"} — MUTX`,
      description: data.description as string,
      url: getCanonicalUrl("/roadmap"),
      images: [getOgImageUrl()],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Roadmap"} — MUTX`,
      description: data.description as string,
      images: [getOgImageUrl()],
    },
  };
}

export default async function RoadmapPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "roadmap.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Roadmap"}>
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
