import { remark } from "remark";
import remarkGfm from "remark-gfm";

interface DocsRendererProps {
  source: string;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function addHeadingAnchors(html: string, headings: Heading[]): string {
  let result = html;
  for (const heading of headings) {
    const escaped = heading.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(<h${heading.level}([^>]*)>)(.{0,5}?)(${escaped})(</h${heading.level}>)`,
      "i"
    );
    result = result.replace(
      regex,
      `$1<a id="${heading.id}" href="#${heading.id}" class="heading-anchor" aria-hidden="true">#</a>$3$4$5`
    );
  }
  return result;
}

export async function DocsRenderer({ source }: DocsRendererProps) {
  const headings = extractHeadings(source);

  const result = await remark()
    .use(remarkGfm)
    .process(source);

  const htmlWithAnchors = addHeadingAnchors(result.toString(), headings);

  return (
    <article
      className="docs-prose"
      dangerouslySetInnerHTML={{ __html: htmlWithAnchors }}
    />
  );
}

export function extractHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  const lines = source.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{2,4})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      headings.push({
        id: slugify(text),
        text,
        level: m[1].length,
      });
    }
  }
  return headings;
}
