import fs from "fs";
import path from "path";

export interface DocNavItem {
  title: string;
  href: string;
  slug: string;
  children: DocNavItem[];
  depth: number;
}

function lineDepth(line: string): number {
  return line.match(/^(\s*)/)?.[0].length ?? 0;
}

function parseLine(line: string): { title: string; href: string; slug: string } | null {
  const match = line.match(/^\s*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return null;
  const [, title, href] = match;
  // Convert file paths like docs/api/index.md -> api/index
  // or absolute paths like /manifesto -> manifesto
  let slug = href
    .replace(/^docs\//, "")
    .replace(/\.md$/, "")
    .replace(/^\//, "");
  return { title, href, slug };
}

export function parseSummary(): DocNavItem[] {
  const summaryPath = path.join(process.cwd(), "SUMMARY.md");
  const content = fs.readFileSync(summaryPath, "utf-8");
  const lines = content.split("\n");

  const root: DocNavItem[] = [];
  const stack: { item: DocNavItem; depth: number }[] = [];

  for (const line of lines) {
    if (!line.includes("[") || !line.includes("](")) continue;

    const parsed = parseLine(line);
    if (!parsed) continue;

    const depth = lineDepth(line);
    const item: DocNavItem = {
      title: parsed.title,
      href: parsed.href,
      slug: parsed.slug,
      children: [],
      depth,
    };

    // Find where to insert
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].item.children.push(item);
    }

    stack.push({ item, depth });
  }

  return root;
}

export function flatNav(items: DocNavItem[]): DocNavItem[] {
  const result: DocNavItem[] = [];
  for (const item of items) {
    result.push(item);
    result.push(...flatNav(item.children));
  }
  return result;
}
