import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

export async function generateMetadata() {
  const source = fs.readFileSync(path.join(process.cwd(), "whitepaper.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Whitepaper"} — MUTX`,
    description: data.description,
  };
}

export default async function WhitepaperPage() {
  const source = fs.readFileSync(path.join(process.cwd(), "whitepaper.md"), "utf-8");
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
