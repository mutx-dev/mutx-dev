#!/usr/bin/env npx tsx
/**
 * Build MUTX docs search index.
 * Run: npx tsx scripts/build-docs-search-index.ts
 * Output: public/docs-search-index.json
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

const DOCS_DIR = path.join(process.cwd(), "docs");
// Root-level content dirs (mirrored from repo root) also served under /docs/*
const ROOT_CONTENT_DIRS = ["agents"];
const OUTPUT_PATH = path.join(process.cwd(), "public", "docs-search-index.json");

interface SearchEntry {
  id: string;
  title: string;
  section: string;
  content: string;
  href: string;
  headings: string[];
}

interface SearchDocument {
  title: string;
  href: string;
  section: string;
  entries: SearchEntry[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function markdownToPlainText(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).process(md);
  return stripHtml(result.toString());
}

function extractHeadings(md: string): string[] {
  const headings: string[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const m = line.match(/^#{1,4}\s+(.+)/);
    if (m) headings.push(m[1].replace(/[*_`]/g, "").trim());
  }
  return headings;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function resolveDocHref(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.md$/, "");

  // GitBook maps docs/api/* → /docs/reference/* (api/ prefix flattened + aliased)
  // File paths come in relative to docs/ dir: "api/authentication.md" not "docs/api/authentication.md"
  // e.g. api/reference.md → /docs/reference
  // e.g. api/authentication.md → /docs/reference/authentication
  // e.g. api/index.md → /docs/reference (not /docs/reference/index)
  if (withoutExt.startsWith("api/")) {
    const inner = withoutExt.replace(/^api\//, ""); // e.g. "reference" or "authentication"
    if (inner === "index") return "/docs/reference";
    return `/docs/reference/${inner}`;
  }

  // Handle root-level content (e.g. agents/README.md → /docs/agents)
  const isRootContent = ROOT_CONTENT_DIRS.some((dir) =>
    withoutExt.startsWith(dir + "/") || withoutExt === dir
  );
  if (isRootContent) {
    // For files named AGENT.md inside a subdir, use parent dir name instead
    // e.g. agents/mission-control-orchestrator/AGENT.md → agents/mission-control-orchestrator
    const normalized = withoutExt
      .replace(/\/AGENT$/i, "")
      .replace(/\/README$/i, "")
      .replace(/\/index$/i, "")
      .replace(/^README$/i, "");
    return normalized ? `/docs/${normalized}` : "/docs";
  }

  // Normal docs/ content
  const normalized = withoutExt
    .replace(/^docs\//, "")
    .replace(/\/README$/i, "")
    .replace(/\/index$/i, "")
    .replace(/^README$/i, "");

  if (!normalized) return "/docs";
  return `/docs/${normalized}`;
}

function getSection(relativePath: string): string {
  // Handle root-level content
  const rootParts = relativePath.split("/");
  if (ROOT_CONTENT_DIRS.includes(rootParts[0])) {
    return rootParts[0]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Normal docs/ content
  const parts = relativePath.replace(/^docs\//, "").split("/");
  if (parts.length <= 1) return "Root";
  const top = parts[0];
  return top
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function buildIndex(): Promise<void> {
  const documents: SearchDocument[] = [];

  function walkDir(dir: string, base: string = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(full, rel));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(rel);
      }
    }
    return files;
  }

  const files = walkDir(DOCS_DIR);

  // Also include root-level content dirs served under /docs/*
  // Deduplicate: skip files already returned by the docs walk
  for (const rootDir of ROOT_CONTENT_DIRS) {
    const rootPath = path.join(process.cwd(), rootDir);
    if (fs.existsSync(rootPath)) {
      const rootFiles = walkDir(rootPath, rootDir);
      for (const rf of rootFiles) {
        if (!files.includes(rf)) files.push(rf);
      }
    }
  }

  for (const file of files) {
    // file is root content only if dir starts at the very beginning
    // AND the file actually exists at the repo-root path.
    // If the docs walk returned 'agents/foo.md' it lives at docs/agents/foo.md
    // (the root version doesn't exist), so treat it as docs content.
    const isRootFile = ROOT_CONTENT_DIRS.some((dir) => {
      if (file !== dir && !file.startsWith(dir + "/")) return false;
      return fs.existsSync(path.join(process.cwd(), file));
    });
    const fullPath = isRootFile
      ? path.join(process.cwd(), file)
      : path.join(DOCS_DIR, file);
    const source = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(source);

    const title =
      (data.title as string) ||
      (data.description as string) ||
      path.basename(file, ".md")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const plainText = await markdownToPlainText(content);
    const headings = extractHeadings(content);
    const href = resolveDocHref(file);
    const section = getSection(file);

    // Per-heading entries for precise navigation
    const entries: SearchEntry[] = [];
    const headingMatches = content.matchAll(/^#{1,4}\s+(.+)$/gm);
    for (const match of headingMatches) {
      const headingText = match[1].replace(/[*_`#]/g, "").trim();
      const headingSlug = slugify(headingText);
      const afterHeading = content.slice(match.index! + match[0].length);
      const sectionText = afterHeading.slice(0, 300);

      entries.push({
        id: `${href}#${headingSlug}`,
        title: headingText,
        section,
        content: stripHtml(sectionText).slice(0, 500),
        href: `${href}#${headingSlug}`,
        headings: [],
      });
    }

    // Main document entry
    entries.unshift({
      id: href,
      title,
      section,
      content: plainText.slice(0, 1000),
      href,
      headings,
    });

    documents.push({ title, href, section, entries });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ documents }, null, 2));
  console.log(
    `Search index written to ${OUTPUT_PATH} (${documents.length} docs, ${documents.reduce((s, d) => s + d.entries.length, 0)} entries)`
  );
}

buildIndex().catch((err) => {
  console.error("Failed to build search index:", err);
  process.exit(1);
});
