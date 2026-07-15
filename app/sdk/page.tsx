import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { DocsRenderer } from "@/components/site/docs/DocsRenderer";
import { buildPageMetadata, buildWebPageStructuredData } from "@/lib/seo";


export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/sdk.md"), "utf-8");
  const { data } = matter(source);
  const title = `${data.title || "SDK"} — MUTX`;
  const description = data.description as string;

  return {
    title,
    description,
    ...buildPageMetadata({ title, description, path: "/sdk" }),
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
      <DocsRenderer source={content} currentSlug={["sdk"]} />
    </DocsLayout>
  );
}
