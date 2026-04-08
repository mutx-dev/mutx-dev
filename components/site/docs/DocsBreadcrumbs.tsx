"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocNavItem } from "@/lib/docs";
import { useDocsNav } from "./DocsNavContext";

function findAncestors(
  slug: string,
  items: DocNavItem[]
): DocNavItem[] | null {
  for (const item of items) {
    if (item.slug === slug) return [item];
    if (item.children.length > 0) {
      const found = findAncestors(slug, item.children);
      if (found) return [item, ...found];
    }
  }
  return null;
}

export function DocsBreadcrumbs() {
  const { nav } = useDocsNav();
  const pathname = usePathname() ?? "";
  const currentSlug = pathname.replace(/^\/docs\//, "").replace(/\/$/, "");

  if (!currentSlug || !nav.length) return null;

  // Build ancestor chain from the nav tree
  const ancestors = findAncestors(currentSlug, nav);
  if (!ancestors || ancestors.length === 0) return null;

  const items = [
    { title: "Docs", href: "/docs" },
    ...ancestors.map((item) => ({
      title: item.title,
      href: `/docs/${item.slug}`,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="docs-breadcrumbs">
      <ol className="docs-breadcrumbs-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="docs-breadcrumbs-item">
              {!isLast ? (
                <>
                  <Link href={item.href} className="docs-breadcrumbs-link">
                    {item.title}
                  </Link>
                  <span className="docs-breadcrumbs-sep" aria-hidden="true">
                    ›
                  </span>
                </>
              ) : (
                <span
                  className="docs-breadcrumbs-current"
                  aria-current="page"
                >
                  {item.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
