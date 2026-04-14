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

const ROOT_CONTENT_DIRS = ["agents"];

function docsDir() {
  return path.join(process.cwd(), "docs");
}

function pathExistsWithExactCase(fullPath: string): boolean {
  if (!fs.existsSync(fullPath)) return false;

  const resolved = path.resolve(fullPath);
  const { root } = path.parse(resolved);
  const segments = resolved.slice(root.length).split(path.sep).filter(Boolean);
  let current = root;

  try {
    for (const segment of segments) {
      if (!fs.readdirSync(current).includes(segment)) {
        return false;
      }

      current = path.join(current, segment);
    }
  } catch {
    return false;
  }

  return true;
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

function isRootContent(slugSegments: string[]): boolean {
  return slugSegments.length >= 1 && ROOT_CONTENT_DIRS.includes(slugSegments[0]);
}

function resolveRootContentSlug(slugSegments: string[]): string | null {
  if (!isRootContent(slugSegments)) return null;
  const dir = slugSegments[0];

  if (slugSegments.length >= 2) {
    const subFile = path.join(process.cwd(), "docs", dir, slugSegments[1] + ".md");
    if (pathExistsWithExactCase(subFile)) return subFile;

    const agentFile = path.join(process.cwd(), dir, slugSegments[1], "AGENT.md");
    if (pathExistsWithExactCase(agentFile)) return agentFile;
  }

  const candidates = [
    path.join(process.cwd(), dir, "README.md"),
    path.join(process.cwd(), dir, "index.md"),
    path.join(process.cwd(), "docs", dir, "README.md"),
  ];

  for (const candidate of candidates) {
    if (pathExistsWithExactCase(candidate)) return candidate;
  }

  return null;
}

function hasUnsafeSlugSegment(slugSegments: string[]): boolean {
  return slugSegments.some(
    (segment) =>
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
  );
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

export function resolveDocFileFromSlug(slugSegments: string[]): string | null {
  if (isRootContent(slugSegments)) {
    return resolveRootContentSlug(slugSegments);
  }

  if (hasUnsafeSlugSegment(slugSegments)) {
    return null;
  }

  const docsRoot = path.resolve(docsDir());

  if (slugSegments.length === 1 && slugSegments[0] === "README") {
    const rootReadme = path.join(docsRoot, "README.md");
    if (pathExistsWithExactCase(rootReadme)) return rootReadme;
  }

  if (slugSegments.length === 0) {
    const rootReadme = path.join(docsRoot, "README.md");
    if (pathExistsWithExactCase(rootReadme)) return rootReadme;
  }

  const candidates = [
    path.join(...slugSegments) + ".md",
    path.join(...slugSegments, "README.md"),
    path.join(...slugSegments, "index.md"),
  ];

  for (const candidate of candidates) {
    const fullPath = path.resolve(docsRoot, candidate);
    if (!fullPath.startsWith(`${docsRoot}${path.sep}`)) {
      continue;
    }

    if (pathExistsWithExactCase(fullPath)) {
      return fullPath;
    }
  }

  const apiSlugSegments =
    slugSegments[0] === "reference" ? slugSegments.slice(1) : slugSegments;
  const apiCandidates =
    apiSlugSegments.length === 0
      ? [path.join("api", "reference.md"), path.join("api", "index.md")]
      : [
          path.join("api", ...apiSlugSegments) + ".md",
          path.join("api", ...apiSlugSegments, "README.md"),
          path.join("api", ...apiSlugSegments, "index.md"),
        ];

  for (const candidate of apiCandidates) {
    const fullPath = path.resolve(docsRoot, candidate);
    if (!fullPath.startsWith(`${docsRoot}${path.sep}`)) {
      continue;
    }

    if (pathExistsWithExactCase(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

export function resolveDocFileFromRoute(route: string): string | null {
  if (route === "/docs") {
    return resolveDocFileFromSlug([]);
  }

  if (!route.startsWith("/docs/")) {
    return null;
  }

  return resolveDocFileFromSlug(route.slice("/docs/".length).split("/"));
}

export function getDocSitemapRoutes(): string[] {
  const seen = new Set<string>(["/docs"]);

  for (const item of flatNav(parseSummary())) {
    const route = summaryHrefToDocsRoute(item.href);
    if (route && resolveDocFileFromRoute(route)) {
      seen.add(route);
    }
  }

  return Array.from(seen);
}
