"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DocNavItem } from "@/lib/docs";

interface DocsLayoutProps {
  nav: DocNavItem[];
  children: React.ReactNode;
  title?: string;
}

function NavItem({ item, pathname }: { item: DocNavItem; pathname: string }) {
  const isActive = pathname === `/docs/${item.slug}` || pathname === `/docs/${item.slug}/`;
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <Link
        href={`/docs/${item.slug}`}
        className={`docs-nav-link block py-1 text-sm leading-snug transition-colors ${
          isActive
            ? "font-semibold text-blue-600"
            : "text-gray-600 hover:text-gray-900"
        }`}
        style={{ paddingLeft: `${item.depth * 12 + 8}px` }}
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

export function DocsLayout({ nav, children, title }: DocsLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="docs-shell min-h-screen bg-white font-sans">
      {/* Top bar */}
      <header className="docs-header sticky top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white/95 backdrop-blur px-4 gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900"
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/docs" className="font-semibold text-gray-900 text-sm tracking-tight">
          📖 MUTX Docs
        </Link>

        <div className="flex-1" />

        <a
          href="https://github.com/mutx-dev/mutx-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          GitHub
        </a>
        <span className="text-gray-200">·</span>
        <a
          href="https://mutx.dev"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          mutx.dev
        </a>
      </header>

      <div className="flex relative">
        {/* Left sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left sidebar */}
        <aside
          className={`
            docs-sidebar fixed top-14 left-0 z-20 w-64 h-[calc(100vh-3.5rem)] overflow-y-auto
            border-r border-gray-200 bg-white pb-20
            transform transition-transform duration-200 ease-in-out
            lg:sticky lg:top-14 lg:translate-x-0 lg:z-0 lg:block
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="py-4 pr-4">
            {nav.map((item) => (
              <NavItem key={item.slug} item={item} pathname={pathname} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="docs-content flex-1 min-w-0 px-6 py-8 lg:px-10">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
