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

export function openSearchModal() {
  document.documentElement.setAttribute(SEARCH_ATTR, '1');
}

export function closeSearchModal() {
  document.documentElement.removeAttribute(SEARCH_ATTR);
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

function renderResults(results: SearchEntry[], selectedIndex: number): string {
  if (!results.length) return '';
  const items = results
    .map(
      (r, i) => `
    <li role="option" aria-selected="${i === selectedIndex}"
        class="docs-search-result${i === selectedIndex ? ' selected' : ''}"
        data-href="${r.href}">
      <div class="docs-search-result-top">
        <span class="docs-search-result-title">${r.title}</span>
        <span class="docs-search-result-section">${r.section}</span>
      </div>
      ${r.content ? `<div class="docs-search-result-content">${r.content.slice(0, 120)}…</div>` : ''}
    </li>`
    )
    .join('');
  return `<ul class="docs-search-results" role="listbox">${items}</ul>`;
}

export function DocsSearch() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const selectedRef = useRef(0);
  const router = useRouter();

  // Load search index once
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

  // Set up event delegation for the search UI — runs once when component mounts
  useEffect(() => {
    function handleSearchInput(e: Event) {
      const input = e.target as HTMLInputElement;
      const q = input.value.toLowerCase().trim();
      const modal = input.closest('.docs-search-modal');
      if (!modal) return;

      // Remove old results / empty
      const old = modal.querySelector('.docs-search-results, .docs-search-empty');
      if (old) old.remove();

      if (!q) return;

      const scored = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((s) => s.entry);

      if (scored.length > 0) {
        modal.insertAdjacentHTML('beforeend', renderResults(scored, 0));
      } else {
        const empty = document.createElement('div');
        empty.className = 'docs-search-empty';
        empty.textContent = `No results for "${q}"`;
        modal.appendChild(empty);
      }
      selectedRef.current = 0;
    }

    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      if (!active?.classList.contains('docs-search-input')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const items = [...document.querySelectorAll('.docs-search-result')];
        if (!items.length) return;
        selectedRef.current = Math.min(selectedRef.current + 1, items.length - 1);
        updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...document.querySelectorAll('.docs-search-result')];
        if (!items.length) return;
        selectedRef.current = Math.max(selectedRef.current - 1, 0);
        updateSelection(items);
      } else if (e.key === 'Enter') {
        const items = document.querySelectorAll('.docs-search-result');
        const el = items[selectedRef.current] as HTMLElement;
        if (el?.dataset.href) {
          router.push(el.dataset.href);
          document.documentElement.removeAttribute(SEARCH_ATTR);
        }
      } else if (e.key === 'Escape') {
        document.documentElement.removeAttribute(SEARCH_ATTR);
      }
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Close on backdrop click
      if (!target.closest('.docs-search-modal')) {
        document.documentElement.removeAttribute(SEARCH_ATTR);
        return;
      }
      // Navigate on result click
      const item = target.closest('.docs-search-result') as HTMLElement;
      if (item?.dataset.href) {
        router.push(item.dataset.href);
        document.documentElement.removeAttribute(SEARCH_ATTR);
      }
    }

    function updateSelection(items: Element[]) {
      items.forEach((el, i) => {
        el.classList.toggle('selected', i === selectedRef.current);
        if (i === selectedRef.current) el.scrollIntoView({ block: 'nearest' });
      });
    }

    const overlay = document.querySelector('.docs-search-overlay');
    overlay?.addEventListener('input', handleSearchInput as EventListener);
    overlay?.addEventListener('keydown', handleKeyDown as EventListener);
    overlay?.addEventListener('click', handleClick as EventListener);

    return () => {
      overlay?.removeEventListener('input', handleSearchInput as EventListener);
      overlay?.removeEventListener('keydown', handleKeyDown as EventListener);
      overlay?.removeEventListener('click', handleClick as EventListener);
    };
  }, [entries, router]);

  // When opened via attribute, focus the input and clear it
  useEffect(() => {
    function handleOpen() {
      const overlay = document.querySelector('.docs-search-overlay') as HTMLElement;
      const input = document.querySelector('.docs-search-input') as HTMLInputElement;
      if (overlay) overlay.style.display = 'flex';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 10);
      }
    }

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          m.type === 'attributes' &&
          m.attributeName === SEARCH_ATTR &&
          document.documentElement.hasAttribute(SEARCH_ATTR)
        ) {
          handleOpen();
        }
      }
    });

    const el = document.documentElement;
    obs.observe(el, { attributes: true, attributeFilter: [SEARCH_ATTR] });
    if (el.hasAttribute(SEARCH_ATTR)) handleOpen();

    return () => obs.disconnect();
  }, []);

  // Fully imperative: MutationObserver owns overlay display.
  // React never sets inline style on the overlay.
  // This avoids React's render cycle fighting with the observer.
  useEffect(() => {
    function handleOpen() {
      const overlay = document.querySelector('.docs-search-overlay') as HTMLElement;
      const input = document.querySelector('.docs-search-input') as HTMLInputElement;
      if (overlay) overlay.style.display = 'flex';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 20);
      }
    }

    function handleClose() {
      const overlay = document.querySelector('.docs-search-overlay') as HTMLElement;
      if (overlay) overlay.style.display = 'none';
    }

    function onAttrChange(mutations: MutationRecord[]) {
      for (const m of mutations) {
        if (m.type !== 'attributes' || m.attributeName !== SEARCH_ATTR) continue;
        if (document.documentElement.hasAttribute(SEARCH_ATTR)) {
          handleOpen();
        } else {
          handleClose();
        }
      }
    }

    const obs = new MutationObserver(onAttrChange);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: [SEARCH_ATTR] });
    // Sync initial state in case already open (e.g., after hot reload)
    if (document.documentElement.hasAttribute(SEARCH_ATTR)) handleOpen();

    return () => obs.disconnect();
  }, []);

  return (
    <div className="docs-search-overlay">
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
            className="docs-search-input"
            placeholder="Search docs..."
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="docs-search-kbd">Esc</kbd>
        </div>
      </div>
    </div>
  );
}
