'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import fs from 'fs';
import path from 'path';

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

interface SearchResult extends SearchEntry {
  section: string;
}

let indexCache: SearchResult[] | null = null;

function loadIndex(): SearchResult[] {
  if (indexCache) return indexCache;

  // Only runs on client — read from static public file
  if (typeof window === 'undefined') return [];

  try {
    const res = await fetch('/docs-search-index.json');
    const data: SearchIndex = await res.json();
    indexCache = data.documents.flatMap((doc) =>
      doc.entries.map((e) => ({ ...e, section: doc.section }))
    );
    return indexCache;
  } catch {
    return [];
  }
}

function searchDocs(query: string, results: SearchResult[]): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  // Simple substring + word-boundary match — fast, no WASM, good enough
  return results
    .map((r) => {
      const title = r.title.toLowerCase();
      const content = r.content.toLowerCase();
      const section = r.section.toLowerCase();

      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (section.includes(q)) score = 30;
      else if (content.includes(q)) score = 10;
      else return null;

      return { ...r, _score: score };
    })
    .filter(Boolean)
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .slice(0, 12) as SearchResult[];
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allDocs, setAllDocs] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);

  // Load index once
  useEffect(() => {
    fetch('/docs-search-index.json')
      .then((r) => r.json())
      .then((data: SearchIndex) => {
        const flat = data.documents.flatMap((doc) =>
          doc.entries.map((e) => ({ ...e, section: doc.section }))
        );
        setAllDocs(flat);
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut
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

  // Focus input when opened
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
        const content = r.content.toLowerCase();
        const section = r.section.toLowerCase();
        let score = 0;
        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 60;
        else if (section.includes(q)) score = 30;
        else if (content.includes(q)) score = 10;
        else return null;
        return { ...r, _score: score };
      })
      .filter(Boolean)
      .sort((a, b) => (b as any)._score - (a as any)._score)
      .slice(0, 12);
    setResults(filtered as any);
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
          <kbd className="docs-search-kbd" onClick={() => setOpen(false)}>Esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="docs-search-results" ref={listRef}>
            {results.map((r, i) => (
              <li
                key={r.id}
                className={`docs-search-result${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => navigate(r.href)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="docs-search-result-title">{r.title}</span>
                <span className="docs-search-result-section">{r.section}</span>
                <span className="docs-search-result-content">
                  {r.content.slice(0, 100)}…
                </span>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="docs-search-empty">No results for &ldquo;{query}&rdquo;</div>
        )}
      </div>
    </div>
  );
}
