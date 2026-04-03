import { notFound, redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DocsRenderer } from "@/components/site/docs/DocsRenderer";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function docsDir() {
  return path.join(process.cwd(), "docs");
}

function resolveSlug(slugSegments: string[]): string | null {
  // Special case: /docs/README -> docs/README.md (the index)
  if (slugSegments.length === 1 && slugSegments[0] === "README") {
    const rootReadme = path.join(docsDir(), "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  if (slugSegments.length === 0) {
    const rootReadme = path.join(docsDir(), "README.md");
    if (fs.existsSync(rootReadme)) return rootReadme;
  }

  const candidates = [
    path.join(...slugSegments) + ".md",
    path.join(...slugSegments, "README.md"),
    path.join(...slugSegments, "index.md"),
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(docsDir(), candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = ["README"] } = await params;
  const filePath = resolveSlug(slug);
  if (!filePath) return { title: "Not Found" };

  const source = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(source);
  const title = (data.title as string) || (data.description as string) || "MUTX Docs";
  return {
    title: `${title} — MUTX Docs`,
    description: data.description as string,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  // Empty slug → redirect to /docs/README
  if (!slug || slug.length === 0 || (slug.length === 1 && slug[0] === "")) {
    redirect("/docs/README");
  }

  const filePath = resolveSlug(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);

  return (
    <div>
      <DocsRenderer source={content} />
      {data.icon && (
        <p className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
          Last updated via GitBook sync — source at{" "}
          <a
            href={`https://github.com/mutx-dev/mutx-dev/blob/main/${path.relative(process.cwd(), filePath)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            GitHub
          </a>
        </p>
      )}
    </div>
  );
}
