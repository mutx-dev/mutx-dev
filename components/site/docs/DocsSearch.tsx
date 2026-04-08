'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface AllDocEntry extends SearchEntry {
  _score?: never; // prevent misuse — allDocs doesn't use _score
}

interface SearchResult extends SearchEntry {
  _score: number;
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allDocs, setAllDocs] = useState<AllDocEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load index once
  useEffect(() => {
    fetch('/docs-search-index.json')
      .then((r) => r.json())
      .then((data: SearchIndex) => {
        const flat = data.documents.flatMap((doc) =>
          doc.entries.map((e) => ({ ...e, section: doc.section } as AllDocEntry))
        );
        setAllDocs(flat);
      })
      .catch(() => {});
  }, []);

  // Global keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus + reset when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = allDocs
      .map((r) => {
        const title = r.title.toLowerCase();
        const section = r.section.toLowerCase();
        const content = r.content.toLowerCase();
        let score = 0;
        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 60;
        else if (section === q) score = 50;
        else if (section.includes(q)) score = 30;
        else if (content.includes(q)) score = 10;
        else return null;
        return { ...r, _score: score };
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, allDocs]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="docs-search-overlay" onClick={() => setOpen(false)}>
      <div className="docs-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="docs-search-input-row">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="docs-search-icon"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="docs-search-input"
            placeholder="Search docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && results[selectedIndex]) {
                navigate(results[selectedIndex].href);
              }
            }}
          />
          <kbd className="docs-search-kbd" onClick={() => setOpen(false)}>
            Esc
          </kbd>
        </div>

        {results.length > 0 && (
          <ul className="docs-search-results" role="listbox">
            {results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === selectedIndex}
                className={`docs-search-result${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => navigate(r.href)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="docs-search-result-top">
                  <span className="docs-search-result-title">{r.title}</span>
                  <span className="docs-search-result-section">{r.section}</span>
                </div>
                {r.content && (
                  <div className="docs-search-result-content">
                    {r.content.slice(0, 120)}…
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="docs-search-empty">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
