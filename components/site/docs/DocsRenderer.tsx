import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { preprocessHints } from "@/lib/docs/hints";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function remarkResolveDocLinks(currentSlug: string[]): Plugin<[], Root> {
  return () => (tree: Root) => {
    visit(tree, "link", (node) => {
      const href = node.url || "";
      if (!href || href.startsWith("#") || href.startsWith("/") || href.startsWith("http")) return;

      let resolved = href.replace(/\.md$/, "");

      if (currentSlug.length > 0) {
        const dir = currentSlug[currentSlug.length - 1] === "README"
          ? currentSlug.slice(0, -1)
          : currentSlug;
        if (dir.length > 0) {
          resolved = `/docs/${dir.join("/")}/${resolved}`;
        } else {
          resolved = `/docs/${resolved}`;
        }
      } else {
        resolved = `/docs/${resolved}`;
      }

      const filename = href.replace(/\.md$/, "");
      const firstChild = node.children?.[0];
      const linkText = (firstChild && "value" in firstChild ? firstChild.value : "") || "";
      if (linkText === href || linkText === filename) {
        const displayText = filename
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        node.children = [{ type: "text", value: displayText }];
      }

      node.url = resolved;
    });
  };
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

const docsSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "article",
    "section",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "blockquote",
    "code",
    "pre",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), "href", "title", "target", "rel", "className", "ariaHidden", "tabIndex"],
    img: [...(defaultSchema.attributes?.img || []), "src", "alt", "title", "className"],
    table: [...(defaultSchema.attributes?.table || []), "data-view", "className"],
    blockquote: [...(defaultSchema.attributes?.blockquote || []), "data-type", "className"],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    th: [...(defaultSchema.attributes?.th || []), "align"],
    td: [...(defaultSchema.attributes?.td || []), "align"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
  },
};

export async function DocsRenderer({ source, currentSlug = [] }: { source: string; currentSlug?: string[] }) {
  const preprocessed = preprocessHints(source);
  const headings = extractHeadings(preprocessed);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkResolveDocLinks(currentSlug))
    .use(remarkRehype, { allowDangerousHtml: false })
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
    .use(rehypeSanitize, docsSchema)
    .use(rehypeStringify)
    .process(preprocessed);

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

  const { DocsRendererClient } = await import("./DocsRendererClient");
  return <DocsRendererClient html={html} />;
}
