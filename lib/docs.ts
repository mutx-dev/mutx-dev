import fs from "fs";
import path from "path";

export interface DocNavItem {
  title: string;
  href: string;
  slug: string;
  route: string; // actual Next.js route (e.g. /agents or /docs/api)
  children: DocNavItem[];
  depth: number;
  isPage?: boolean; // true = leaf page, false/undefined = section group
}

function lineDepth(line: string): number {
  // Measure indent of the list-marker (*), not the whole line.
  // "  * [Title]" -> depth 1 (one indent level)
  // "* [Title]"   -> depth 0 (top-level)
  const match = line.match(/^(\s*)\*/);
  if (!match) return 0;
  const indent = match[1].length;
  // Each indent level = 2 spaces (standard markdown convention)
  return Math.floor(indent / 2);
}

function normalizeSummaryHrefToSlug(href: string): string {
  const stripped = href.replace(/^docs\//, "").replace(/\.md$/, "").replace(/^\//, "");
  // Root-level content dirs (agents/) should route to / not /docs
  if (!href.startsWith("docs/")) {
    return stripped.replace(/\/README$/i, "").replace(/\/index$/i, "") || stripped;
  }
  return stripped;
}

function parseLine(line: string): { title: string; href: string; slug: string } | null {
  const match = line.match(/^\s*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return null;
  const [, title, href] = match;
  return { title, href, slug: normalizeSummaryHrefToSlug(href) };
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
      route: summaryHrefToDocsRoute(parsed.href) ?? `/docs/${parsed.slug}`,
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

export function summaryHrefToDocsRoute(href: string): string | null {
  // GitBook maps docs/api/* → /docs/* (api/ prefix is flattened)
  // e.g. docs/api/reference.md → /docs/reference
  // e.g. docs/api/authentication.md → /docs/reference/authentication
  const normalized = href.replace(/^docs\/api\//, "docs/");

  if (!normalized.startsWith("docs/")) {
    // Root-level content (e.g. agents/README.md) → mount under /docs/*
    const slug = normalizeSummaryHrefToSlug(normalized)
      .replace(/\/README$/i, "")
      .replace(/\/index$/i, "")
      .replace(/^README$/i, "");
    return slug ? `/docs/${slug}` : "/docs";
  }

  // docs/ prefixed: strip prefix, use rest as the route path
  // e.g. docs/architecture/README → /docs/architecture
  const slug = normalizeSummaryHrefToSlug(normalized)
    .replace(/\/README$/i, "")
    .replace(/\/index$/i, "")
    .replace(/^README$/i, "");
  return `/docs/${slug}`;
}

export function getDocSitemapRoutes(): string[] {
  const seen = new Set<string>(["/docs"]);

  for (const item of flatNav(parseSummary())) {
    const route = summaryHrefToDocsRoute(item.href);
    if (route) {
      seen.add(route);
    }
  }

  return Array.from(seen);
}
