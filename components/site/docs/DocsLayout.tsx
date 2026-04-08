'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DocNavItem } from '@/lib/docs';
import { DocsSearch } from './DocsSearch';
import { ThemeSwitcher } from './ThemeSwitcher';
import '@/app/docs/docs.css';

interface NavItemProps {
  item: DocNavItem;
  pathname: string;
}

interface DocsLayoutProps {
  nav: DocNavItem[];
  children: React.ReactNode;
  title?: string;
}

function navItemKey(slug: string) {
  return `docs-nav-open:${slug}`;
}

function NavItem({ item, pathname }: NavItemProps) {
  const hasChildren = item.children.length > 0;
  const [open, setOpen] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(navItemKey(item.slug));
      if (stored !== null) setOpen(stored === 'true');
    } catch {}
  }, [item.slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(navItemKey(item.slug), String(next));
    } catch {}
  }

  const isActive =
    pathname === `/docs/${item.slug}` ||
    pathname === `/docs/${item.slug}/`;

  // Determine if any descendant is active (for auto-expand)
  function isAncestorActive(items: DocNavItem[]): boolean {
    for (const child of items) {
      if (
        pathname === `/docs/${child.slug}` ||
        pathname === `/docs/${child.slug}/`
      )
        return true;
      if (child.children.length > 0 && isAncestorActive(child.children))
        return true;
    }
    return false;
  }

  useEffect(() => {
    if (hasChildren && isAncestorActive(item.children)) {
      setOpen(true);
      try {
        localStorage.setItem(navItemKey(item.slug), 'true');
      } catch {}
    }
  }, [pathname, hasChildren, item.children, item.slug]);

  return (
    <div className="docs-nav-section">
      <div className={`docs-nav-row${hasChildren ? ' has-children' : ''}`}>
        {hasChildren && (
          <button
            className={`docs-nav-chevron-btn${open ? ' open' : ''}`}
            onClick={toggle}
            aria-label={open ? 'Collapse' : 'Expand'}
            aria-expanded={open}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
              className="docs-nav-chevron-icon"
            >
              <path
                d="M2 3.5L5 6.5L8 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <Link
          href={`/docs/${item.slug}`}
          className={`docs-nav-link${isActive ? ' active' : ''}${
            item.depth > 0 ? ' docs-nav-link-nested' : ''
          }`}
          style={{ paddingLeft: hasChildren ? '4px' : `${item.depth * 16 + 16}px` }}
        >
          {item.title}
        </Link>
      </div>

      {hasChildren && open && (
        <div className="docs-nav-children">
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

        <button
          className="docs-search-trigger"
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            });
            window.dispatchEvent(event);
          }}
          aria-label="Search docs (Cmd+K)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="6.5"
              cy="6.5"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 10L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="docs-search-trigger-text">Search…</span>
          <kbd className="docs-search-kbd">⌘K</kbd>
        </button>

        <DocsSearch />

        <ThemeSwitcher />

        <a
          href="https://github.com/mutx-dev/mutx-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="docs-header-link"
        >
          GitHub
        </a>
        <span style={{ color: 'var(--gb-text-3)' }}>·</span>
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
          className={`docs-sidebar${sidebarOpen ? ' open' : ''}`}
          aria-label="Documentation navigation"
        >
          <nav aria-label="Docs nav">
            {nav.map((item) => (
              <NavItem key={item.slug} item={item} pathname={pathname} />
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="docs-content">{children}</main>
      </div>
    </div>
  );
}
