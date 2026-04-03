import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

export async function generateMetadata() {
  const source = fs.readFileSync(path.join(process.cwd(), "infrastructure.md"), "utf-8");
  const { data } = matter(source);
  return {
    title: `${data.title || "Infrastructure"} — MUTX`,
    description: data.description,
  };
}

export default async function InfrastructurePage() {
  const source = fs.readFileSync(path.join(process.cwd(), "infrastructure.md"), "utf-8");
  const { data, content } = matter(source);

  return (
    <DocsLayout nav={[]} title={(data.title as string) || "Infrastructure"}>
      <article className="docs-prose">
        <div
          dangerouslySetInnerHTML={{
            __html: await remark().use(remarkGfm).process(content).then((r) => r.toString()),
          }}
        />
      </article>
    </DocsLayout>
  );
}
