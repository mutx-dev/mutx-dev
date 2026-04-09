import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { preprocessHints } from "@/lib/docs/hints";
import type { Root } from "mdast";
import type { visit } from "unist-util-visit";

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

/**
 * Remark plugin: resolve relative .md links to absolute /docs/* routes.
 * Handles section-landing pages that link to sibling files as [Title](foo.md).
 */
function remarkResolveDocLinks(currentSlug: string[]): Plugin<[], Root> {
  return () => (tree: Root) => {
    // Dynamic import to keep this server-only
    const { visit: visitUnist } = require("unist-util-visit") as {
      visit: typeof visit;
    };
    visitUnist(tree, "link", (node: any) => {
      const href = node.url || "";
      // Only handle relative links (not anchors, not absolute, not external)
      if (!href || href.startsWith("#") || href.startsWith("/") || href.startsWith("http")) return;

      // Strip .md and resolve relative to current doc's directory
      let resolved = href.replace(/\.md$/, "");

      // currentSlug = ["architecture", "README"] for /docs/architecture
      // → directory = "architecture"
      // → resolved = "overview" → /docs/architecture/overview
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

      // Also rewrite the link text if it matches the filename
      // [foo.md](foo.md) → [Foo](resolved_href) — better UX
      const filename = href.replace(/\.md$/, "");
      const linkText = node.children?.[0]?.value || "";
      if (linkText === href || linkText === filename) {
        // Capitalize first letter for readability
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

export async function DocsRenderer({ source, currentSlug = [] }: { source: string; currentSlug?: string[] }) {
  // Preprocess: convert GitBook liquid hints → HTML callouts
  const preprocessed = preprocessHints(source);
  const headings = extractHeadings(preprocessed);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkResolveDocLinks(currentSlug))
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
