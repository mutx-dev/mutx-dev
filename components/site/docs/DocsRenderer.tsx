import { remark } from "remark";
import remarkGfm from "remark-gfm";

interface DocsRendererProps {
  source: string;
}

export async function DocsRenderer({ source }: DocsRendererProps) {
  const result = await remark()
    .use(remarkGfm)
    .process(source);

  const html = result.toString();

  return (
    <article
      className="docs-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
