'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DocNavItem } from '@/lib/docs';
import { DocsNavContext, useDocsNav } from "./DocsNavContext";
import { DocsSearch, openSearchModal } from "./DocsSearch";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DocsBreadcrumbs } from "./DocsBreadcrumbs";
import "@/app/docs/docs.css";

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
  const { onNavigate } = useDocsNav();

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

  // Normalize pathname: strip trailing slash so /docs/api and /docs/api/ both match
  const normPath = pathname.replace(/\/$/, '');
  const itemPath = item.route;

  // Active if current pathname starts with this item's path (handles nested slugs)
  const isActive = normPath === itemPath || normPath.startsWith(itemPath + '/');

  // Determine if any descendant is active (for auto-expand)
  function isAncestorActive(items: DocNavItem[]): boolean {
    for (const child of items) {
      const childPath = child.route;
      const normChildPath = childPath.replace(/\/$/, '');
      if (
        normPath === normChildPath ||
        normPath.startsWith(normChildPath + '/')
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
          href={item.route}
          className={`docs-nav-link${isActive ? ' active' : ''}${
            item.depth > 0 ? ' docs-nav-link-nested' : ''
          }`}
          style={{ paddingLeft: hasChildren ? '4px' : `${item.depth * 16 + 16}px` }}
          onClick={() => onNavigate?.()}
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

function loadOpenState(): string[] {
  try {
    return JSON.parse(localStorage.getItem('docs-nav-open') ?? '[]');
  } catch {
    return [];
  }
}

function saveOpenState(sections: Set<string>) {
  try {
    localStorage.setItem('docs-nav-open', JSON.stringify([...sections]));
  } catch {}
}

export function DocsLayout({ nav, children }: DocsLayoutProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Start with all section roots open by default
    const initial = new Set<string>();
    for (const item of nav) {
      if (item.children.length > 0 && !item.isPage) {
        initial.add(item.slug);
      }
    }
    // Merge with localStorage state
    const saved = loadOpenState();
    for (const s of saved) {
      initial.add(s);
    }
    return initial;
  });

  // Persist open sections to localStorage
  useEffect(() => {
    saveOpenState(openSections);
  }, [openSections]);

  function handleNavigate() {
    document.documentElement.removeAttribute('data-mobile-nav-open');
  }

  return (
    <DocsNavContext.Provider value={{ nav, onNavigate: handleNavigate }}>
    <div className="docs-shell">
      {/* ── Top header ── */}
      <header className="docs-header">
        <button
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
        {/* Mobile nav toggle — inline script bypasses React event system failures */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button[aria-label="Toggle navigation"]');
    var overlay = e.target.closest('.docs-mobile-overlay');
    if (btn) {
      var isOpen = document.documentElement.dataset.mobileNavOpen === '1';
      if (isOpen) {
        delete document.documentElement.dataset.mobileNavOpen;
      } else {
        document.documentElement.dataset.mobileNavOpen = '1';
      }
    }
    if (overlay) {
      delete document.documentElement.dataset.mobileNavOpen;
    }
  });
})();
            `,
          }}
        />

        <Link href="/docs" className="docs-header-logo">
          📖 MUTX Docs
        </Link>

        <div className="flex-1" />

        <button
          className="docs-search-trigger"
          onClick={openSearchModal}
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
        {/* Mobile overlay — controlled by data-mobile-nav-open on <html> */}
        <div className="docs-sidebar-overlay lg:hidden docs-mobile-overlay" />

        {/* ── Left sidebar ── */}
        <aside
          className="docs-sidebar docs-mobile-sidebar"
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
          <DocsBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
    </DocsNavContext.Provider>
  );
}
