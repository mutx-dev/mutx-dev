"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocNavItem } from "@/lib/docs";
import { useDocsNav } from "./DocsNavContext";

function findAncestors(
  pathname: string,
  items: DocNavItem[]
): DocNavItem[] | null {
  for (const item of items) {
    if (
      pathname === item.route ||
      pathname.startsWith(item.route + "/")
    ) return [item];
    if (item.children.length > 0) {
      const found = findAncestors(pathname, item.children);
      if (found) return [item, ...found];
    }
  }
  return null;
}

export function DocsBreadcrumbs() {
  const { nav } = useDocsNav();
  const pathname = usePathname() ?? "";

  if (!pathname || !nav.length) return null;

  // Build ancestor chain from the nav tree using actual pathname
  const ancestors = findAncestors(pathname, nav);
  if (!ancestors || ancestors.length === 0) return null;

  const items = [
    { title: "Docs", href: "/docs" },
    ...ancestors.map((item) => ({
      title: item.title,
      href: item.route,
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
