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
  // e.g. "whitepaper.md"        → docs/whitepaper.md
  // e.g. "docs/api/reference.md" → docs/api/reference.md
  // e.g. "agents/README.md"     → agents/README.md
  const candidates: string[] = [];
  if (href.startsWith("docs/")) {
    candidates.push(path.join(/* turbopackIgnore: true */ process.cwd(), href));
  } else if (href.startsWith("agents/") || href.startsWith("contributing/")) {
    candidates.push(path.join(/* turbopackIgnore: true */ process.cwd(), href));
  } else {
    candidates.push(path.join(/* turbopackIgnore: true */ process.cwd(), "docs", href));
    candidates.push(path.join(/* turbopackIgnore: true */ process.cwd(), href)); // root-level fallback
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
  const summaryPath = path.join(/* turbopackIgnore: true */ process.cwd(), "SUMMARY.md");
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
  if (href === "docs/sdk.md") return "/sdk";
  if (href === "support.md" || href === "docs/support.md") return "/support";

  // GitBook maps docs/api/* → /docs/reference/* (api/ dir → /reference URL path)
  // e.g. docs/api/reference.md → /docs/reference
  // e.g. docs/api/authentication.md → /docs/reference/authentication
  // e.g. docs/api/index.md → /docs/reference

  let working = href;

  // 1. Remap docs/api/ → docs/reference/
  working = working.replace(/^docs\/api\//, "docs/reference/");

  // 2. Strip docs/ prefix to get the slug path
  const slug = working.replace(/^docs\//, "");

  // 3. Strip .md, /README, /index suffixes
  let clean = slug
    .replace(/\.md$/, "")
    .replace(/\/README$/i, "")
    .replace(/\/index$/i, "")
    .replace(/^README$/i, "")
    .replace(/^index$/i, "");

  // 4. docs/api/reference.md → docs/reference/reference → strip redundant segment
  clean = clean.replace(/^reference\/reference$/, "reference");

  if (!clean) return "/docs";
  return `/docs/${clean}`;
}

export function getDocSitemapRoutes(): string[] {
  return Array.from(getPublishedDocRoutes());
}

const INTERNAL_PUBLIC_DOC_PATTERNS = [
  /(^|\/)AGENTS?\.md$/i,
  /(^|\/)(?:runbooks?|internal)(\/|$)/i,
  /claim-to-reality-gap-matrix/i,
  /mutation-testing/i,
  /deployment\/(?:cli-release|release-v0\.1)\.md$/i,
];

function isSafePublicDocPath(filePath: string, docsRoot: string): boolean {
  const resolved = path.resolve(filePath);
  const relative = path.relative(docsRoot, resolved);
  return Boolean(relative) &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative) &&
    relative.endsWith(".md") &&
    !INTERNAL_PUBLIC_DOC_PATTERNS.some((pattern) => pattern.test(relative));
}

function docsFileToRoute(filePath: string, docsRoot: string): string {
  let relative = path.relative(docsRoot, filePath).replace(/\\/g, "/");
  relative = relative.replace(/\.md$/i, "");
  relative = relative.replace(/\/(README|index)$/i, "");
  relative = relative.replace(/^(README|index)$/i, "");
  if (relative === "api/reference" || relative === "api/index") return "/docs/reference";
  if (relative.startsWith("api/")) relative = `reference/${relative.slice(4)}`;
  return relative ? `/docs/${relative}` : "/docs";
}

function linkedMarkdownPaths(source: string): string[] {
  const hrefs = new Set<string>();
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) hrefs.add(match[1]);
  for (const match of source.matchAll(/href=["']([^"']+)["']/gi)) hrefs.add(match[1]);
  return Array.from(hrefs);
}

function resolveLinkedDocPath(href: string, fromFile: string, docsRoot: string): string | null {
  const clean = href.split("#", 1)[0].split("?", 1)[0].trim();
  if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith("//")) return null;

  let candidate: string;
  if (clean.startsWith("/docs/")) {
    let routePath = clean.slice("/docs/".length);
    if (routePath === "reference") routePath = "api/reference";
    else if (routePath.startsWith("reference/")) routePath = `api/${routePath.slice("reference/".length)}`;
    candidate = path.join(docsRoot, routePath);
  } else if (clean.startsWith("/")) {
    return null;
  } else {
    candidate = path.resolve(path.dirname(fromFile), clean);
  }

  const candidates = /\.md$/i.test(candidate)
    ? [candidate]
    : [`${candidate}.md`, path.join(candidate, "README.md"), path.join(candidate, "index.md")];
  return candidates.find((filePath) => fs.existsSync(filePath) && isSafePublicDocPath(filePath, docsRoot)) ?? null;
}

/**
 * Public docs are the curated SUMMARY tree plus safe Markdown pages linked from
 * that tree. This keeps internal repo material hidden without turning valid
 * links in published docs into redirect dead ends.
 */
export function getPublishedDocRoutes(): Set<string> {
  const docsRoot = path.resolve(process.cwd(), "docs");
  const routes = new Set<string>(["/docs"]);
  const queue: string[] = [];
  const visited = new Set<string>();

  for (const item of flatNav(parseSummary())) {
    const route = summaryHrefToDocsRoute(item.href);
    if (route?.startsWith("/docs")) routes.add(route);
    if (!item.href.startsWith("docs/")) continue;
    const filePath = path.resolve(process.cwd(), item.href);
    if (fs.existsSync(filePath) && isSafePublicDocPath(filePath, docsRoot)) queue.push(filePath);
  }

  while (queue.length > 0) {
    const filePath = queue.shift()!;
    if (visited.has(filePath)) continue;
    visited.add(filePath);
    routes.add(docsFileToRoute(filePath, docsRoot));

    const source = fs.readFileSync(filePath, "utf-8");
    for (const href of linkedMarkdownPaths(source)) {
      const linkedPath = resolveLinkedDocPath(href, filePath, docsRoot);
      if (linkedPath && !visited.has(linkedPath)) queue.push(linkedPath);
    }
  }

  return routes;
}
