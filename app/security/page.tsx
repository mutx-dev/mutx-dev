import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl } from "@/lib/seo";


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
      images: [getOgImageUrl()],
    },
    twitter: {
      card: "summary_large_image",
      creator: DEFAULT_X_HANDLE,
      title: `${data.title || "Security"} — MUTX`,
      description: data.description as string,
      images: [getOgImageUrl()],
    },
  };
}

export default async function SecurityPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "security.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Security"}>
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
