'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SEARCH_ATTR = 'data-docs-search-open';

interface SearchEntry {
  id: string;
  title: string;
  section: string;
  content: string;
  href: string;
}

interface SearchDocument {
  title: string;
  href: string;
  section: string;
  entries: SearchEntry[];
}

interface SearchIndex {
  documents: SearchDocument[];
}

export function DocsSearch() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load search index
  useEffect(() => {
    fetch('/docs-search-index.json')
      .then((r) => r.json())
      .then((data: SearchIndex) => {
        const flat = data.documents.flatMap((doc) =>
          doc.entries.map((e) => ({ ...e, section: doc.section }))
        );
        setEntries(flat);
      })
      .catch(() => {});
  }, []);

  // Watch attribute for open/close
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const open = document.documentElement.hasAttribute(SEARCH_ATTR);
      setIsOpen(open);
      if (open) {
        setQuery('');
        setSelected(0);
        setTimeout(() => inputRef.current?.focus(), 20);
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: [SEARCH_ATTR] });
    if (document.documentElement.hasAttribute(SEARCH_ATTR)) setIsOpen(true);
    return () => obs.disconnect();
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          document.documentElement.removeAttribute(SEARCH_ATTR);
        } else {
          document.documentElement.setAttribute(SEARCH_ATTR, '1');
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const q = query.toLowerCase().trim();
  const results = q
    ? entries
        .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((s) => s.entry)
    : [];

  function navigate(href: string) {
    document.documentElement.removeAttribute(SEARCH_ATTR);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[selected]) navigate(results[selected].href);
    } else if (e.key === 'Escape') {
      document.documentElement.removeAttribute(SEARCH_ATTR);
    }
  }

  useEffect(() => {
    const el = resultsRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!isOpen) return null;

  return (
    <div className="docs-search-overlay" onClick={() => document.documentElement.removeAttribute(SEARCH_ATTR)}>
      <div className="docs-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="docs-search-input-row">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="docs-search-icon">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="docs-search-input"
            placeholder="Search docs..."
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="docs-search-kbd">Esc</kbd>
        </div>
        {q && (
          <div className="docs-search-body" ref={resultsRef}>
            {results.length > 0 ? (
              <ul className="docs-search-results" role="listbox">
                {results.map((r, i) => (
                  <li
                    key={r.href + r.title}
                    role="option"
                    aria-selected={i === selected}
                    data-selected={i === selected}
                    className={"docs-search-result" + (i === selected ? " selected" : "")}
                    onClick={() => navigate(r.href)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <div className="docs-search-result-link">
                      <div className="docs-search-result-meta">
                        <span className="docs-search-result-section">{r.section}</span>
                      </div>
                      <div className="docs-search-result-title">{r.title}</div>
                      {r.content && (
                        <div className="docs-search-result-snippet">{r.content.slice(0, 120)}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="docs-search-empty">No results for &ldquo;{query}&rdquo;</div>
            )}
          </div>
        )}
        {results.length > 0 && (
          <div className="docs-search-hint">
            <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        )}
      </div>
    </div>
  );
}

function scoreEntry(entry: SearchEntry, q: string): number {
  const title = entry.title.toLowerCase();
  const section = entry.section.toLowerCase();
  const content = entry.content.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (section === q) return 50;
  if (section.includes(q)) return 30;
  if (content.includes(q)) return 10;
  return 0;
}
