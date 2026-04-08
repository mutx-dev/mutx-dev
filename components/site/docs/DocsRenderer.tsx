import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { preprocessHints } from "@/lib/docs/hints";

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

function stripMdLinks(source: string): string {
  // Fix relative .md links: [Text](foo.md) → [Text](foo)
  // These are markdown links to other doc pages that would otherwise 404
  return source.replace(/\]\(([^)#\s]*)\.md\)/g, "]($1)");
}

export function extractHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  const lines = source.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{2,4})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      headings.push({ id: slugify(text), text, level: m[1].length });
    }
  }
  return headings;
}

export async function DocsRenderer({ source }: { source: string }) {
  // Preprocess: strip .md links + convert hint blocks
  const preprocessed = stripMdLinks(preprocessHints(source));
  const headings = extractHeadings(preprocessed);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaHidden: "true",
        tabIndex: -1,
      },
      content: {
        type: "element",
        tagName: "span",
        properties: {},
        children: [{ type: "text", value: "#" }],
      },
    })
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(preprocessed);

  // Re-attach IDs from our extracted headings to match slugify behavior
  let html = result.toString();
  for (const heading of headings) {
    const escaped = heading.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(<h${heading.level}([^>]*)>)(.{0,5}?)(${escaped})(</h${heading.level}>)`,
      "i"
    );
    html = html.replace(
      regex,
      `$1<a id="${heading.id}" href="#${heading.id}" class="heading-anchor" aria-hidden="true">#</a>$3$4$5`
    );
  }

  // Dynamic import of client component to avoid SSR issues with DOM APIs
  const { DocsRendererClient } = await import("./DocsRendererClient");
  return <DocsRendererClient html={html} />;
}
