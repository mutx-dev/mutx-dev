"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DocNavItem } from "@/lib/docs";
import { DocsSearch } from "./DocsSearch";
import "@/app/docs/docs.css";

interface DocsLayoutProps {
  nav: DocNavItem[];
  children: React.ReactNode;
  title?: string;
}

function NavItem({
  item,
  pathname,
}: {
  item: DocNavItem;
  pathname: string;
}) {
  const isActive =
    pathname === `/docs/${item.slug}` ||
    pathname === `/docs/${item.slug}/`;
  const hasChildren = item.children.length > 0;

  return (
    <div className="docs-nav-section">
      <Link
        href={`/docs/${item.slug}`}
        className={`docs-nav-link${isActive ? " active" : ""}${
          item.depth > 0 ? " docs-nav-link-nested" : ""
        }`}
        style={{ paddingLeft: `${item.depth * 16 + 16}px` }}
      >
        {item.title}
      </Link>
      {hasChildren && (
        <div>
          {item.children.map((child) => (
            <NavItem key={child.slug} item={child} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsLayout({ nav, children }: DocsLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="docs-shell">
      {/* ── Top header ── */}
      <header className="docs-header">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-1.5 -ml-1.5 text-gb-text-2 hover:text-white transition-colors rounded"
          aria-label="Toggle navigation"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link href="/docs" className="docs-header-logo">
          📖 MUTX Docs
        </Link>

        <div className="flex-1" />

        <DocsSearch />

        <a
          href="https://github.com/mutx-dev/mutx-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="docs-header-link"
        >
          GitHub
        </a>
        <span style={{ color: "var(--gb-text-3)" }}>·</span>
        <a href="https://mutx.dev" className="docs-header-link">
          mutx.dev
        </a>
      </header>

      {/* ── Body layout ── */}
      <div className="docs-layout">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="docs-sidebar-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Left sidebar ── */}
        <aside
          className={`docs-sidebar${sidebarOpen ? " open" : ""}`}
          aria-label="Documentation navigation"
        >
          <nav aria-label="Docs nav">
            {nav.map((item) => (
              <NavItem key={item.slug} item={item} pathname={pathname} />
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="docs-content">
          {children}
        </main>
      </div>
    </div>
  );
}
