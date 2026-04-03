import fs from 'fs';
import path from 'path';
import DocsLayout from '../DocsLayout';

function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content };
  
  const [, frontmatterStr, body] = match;
  const data: Record<string, unknown> = {};
  
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    data[key] = value;
  }
  
  return { data, content: body };
}

const DOCS_DIR = path.join(process.cwd(), 'docs');

interface NavItem {
  slug: string;
  title: string;
  depth: number;
  children: NavItem[];
}

function buildNav(dir: string, baseSlug = '', depth = 0): NavItem[] {
  const items: NavItem[] = [];
  
  if (!fs.existsSync(dir)) return items;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const slug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      const item: NavItem = {
        slug,
        title: entry.name
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()),
        depth,
        children: buildNav(path.join(dir, entry.name), slug, depth + 1),
      };
      items.push(item);
    } else if (entry.name.endsWith('.md')) {
      const slug = baseSlug
        ? `${baseSlug}/${entry.name.replace('.md', '')}`
        : entry.name.replace('.md', '');
      const filePath = path.join(dir, entry.name);
      let title = entry.name.replace('.md', '');
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data } = parseFrontmatter(content);
        if (data.title) title = data.title as string;
      } catch {}
      
      items.push({
        slug,
        title: title
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()),
        depth,
        children: [],
      });
    }
  }
  
  return items;
}

function getAllDocSlugs(dir: string, baseSlug = ''): string[] {
  const slugs: string[] = [];
  
  if (!fs.existsSync(dir)) return slugs;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const slug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      slugs.push(...getAllDocSlugs(path.join(dir, entry.name), slug));
    } else if (entry.name.endsWith('.md')) {
      const slug = baseSlug
        ? `${baseSlug}/${entry.name.replace('.md', '')}`
        : entry.name.replace('.md', '');
      slugs.push(slug);
    }
  }
  
  return slugs;
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs(DOCS_DIR);
  return slugs.map((slug) => ({ slug: slug.split('/') }));
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const slugStr = slug?.join('/') || 'README';
  const filePath = path.join(DOCS_DIR, `${slugStr}.md`);
  
  let content = '';
  let frontmatter: Record<string, unknown> = {};
  
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(fileContent);
    content = parsed.content;
    frontmatter = parsed.data;
  } else if (slugStr === 'README') {
    const readmePath = path.join(DOCS_DIR, 'README.md');
    if (fs.existsSync(readmePath)) {
      const fileContent = fs.readFileSync(readmePath, 'utf-8');
      const parsed = parseFrontmatter(fileContent);
      content = parsed.content;
      frontmatter = parsed.data;
    }
  }
  
  const nav = buildNav(DOCS_DIR);
  const title = (frontmatter.title as string) || 
    slugStr.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <DocsLayout nav={nav} title={title}>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </DocsLayout>
  );
}
