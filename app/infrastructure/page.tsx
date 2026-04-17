import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { buildPageMetadata, buildWebPageStructuredData } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/infrastructure.md"), "utf-8");
  const { data } = matter(source);
  const title = `${data.title || "Infrastructure"} — MUTX`;
  const description = data.description as string;

  return {
    title,
    description,
    ...buildPageMetadata({ title, description, path: "/infrastructure" }),
  };
}

export default async function InfrastructurePage() {
  const source = fs.readFileSync(path.join(process.cwd(), "docs/infrastructure.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Infrastructure"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebPageStructuredData({ name: `${data.title || "Infrastructure"} | MUTX`, path: "/infrastructure", description: (data.description as string) || "" })) }}
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
