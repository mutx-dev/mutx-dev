import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface DocNavItem {
  title: string;
  href: string;
  slug: string;
  route: string; // actual Next.js route (e.g. /agents or /docs/api)
  children: DocNavItem[];
  depth: number;
  isPage?: boolean; // true = leaf page, false/undefined = section group
  icon?: string; // GitBook icon name from frontmatter (e.g. "bullseye", "book")
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

/**
 * Read frontmatter from a doc file to extract the `icon` field.
 * Returns undefined if the file doesn't exist or has no icon.
 */
function getDocIcon(href: string): string | undefined {
  // Build the file path from the SUMMARY href
  // e.g. "manifesto.md"         → docs/manifesto.md
  // e.g. "whitepaper.md"        → whitepaper.md (root-level)
  // e.g. "docs/api/reference.md" → docs/api/reference.md
  // e.g. "agents/README.md"     → agents/README.md
  const candidates: string[] = [];
  if (href.startsWith("docs/")) {
    candidates.push(path.join(process.cwd(), href));
  } else if (href.startsWith("agents/") || href.startsWith("contributing/")) {
    candidates.push(path.join(process.cwd(), href));
  } else {
    candidates.push(path.join(process.cwd(), "docs", href));
    candidates.push(path.join(process.cwd(), href)); // root-level fallback
  }

  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      if (typeof data.icon === "string") return data.icon;
    } catch {
      // try next candidate
    }
  }
  return undefined;
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
      icon: getDocIcon(parsed.href),
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

  let working = href;

  // 1. Flatten docs/api/ prefix
  working = working.replace(/^docs\/api\//, "docs/");

  // 2. Strip docs/ prefix to get the slug path
  const slug = working.replace(/^docs\//, "");

  // 3. Strip .md, /README, /index suffixes
  const clean = slug
    .replace(/\.md$/, "")
    .replace(/\/README$/i, "")
    .replace(/\/index$/i, "")
    .replace(/^README$/i, "");

  if (!clean) return "/docs";
  return `/docs/${clean}`;
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
