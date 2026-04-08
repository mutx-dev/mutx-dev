"use client";

import { useEffect, useRef } from "react";

interface DocsRendererClientProps {
  html: string;
}

const CALLOUT_TYPE_MAP: Record<string, string> = {
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  CAUTION: "warning",
  DANGER: "danger",
  INFO: "note",
};

function getCalloutIcon(type: string): string {
  switch (type) {
    case "note":
      return `<svg class="docs-callout-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    case "warning":
      return `<svg class="docs-callout-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    case "danger":
      return `<svg class="docs-callout-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    case "tip":
      return `<svg class="docs-callout-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2a4 4 0 011.5 7.75L11 11l-1 .25L9.5 12H8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6h.5M6 8h.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    default:
      return `<svg class="docs-callout-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  }
}

export function DocsRendererClient({ html }: DocsRendererClientProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ── Transform callout blockquotes ─────────────────────────
    const blockquotes = el.querySelectorAll<HTMLElement>("blockquote");
    blockquotes.forEach((bq) => {
      const inner = bq.innerHTML.trim();
      // GitBook callout pattern: > [!TYPE] ... or > [!TYPE: Title] ...
      const calloutMatch = inner.match(/^\[!([A-Z]+)(?::\s*([^\]]*))?\]\s*/i);
      if (!calloutMatch) return;

      const rawType = calloutMatch[1].toUpperCase();
      const title = calloutMatch[2] || "";
      const mappedType = CALLOUT_TYPE_MAP[rawType] ?? "note";

      const icon = getCalloutIcon(mappedType);
      let content = inner.slice(calloutMatch[0].length);
      if (title) {
        content = `<strong>${title}</strong>${content ? " " + content : ""}`;
      }

      bq.setAttribute("class", `docs-callout`);
      bq.setAttribute("data-type", mappedType);
      bq.innerHTML = icon + content;
    });

    // ── Transform GitBook card tables ──────────────────────────────
    const cardTables = el.querySelectorAll<HTMLElement>(
      "table[data-view='cards']"
    );
    cardTables.forEach((table) => {
      const rows = table.querySelectorAll<HTMLElement>("tbody tr");
      const cards: string[] = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll<HTMLElement>("td");
        if (cells.length < 2) return;

        const titleEl = cells[0].querySelector("strong") || cells[0];
        const title = titleEl.textContent?.trim() ?? "";
        const desc =
          cells[1].querySelector("p")?.textContent?.trim() ??
          cells[1].textContent?.trim() ??
          "";

        // Target cell: first link href
        const targetLink = cells[2]?.querySelector("a");
        const targetHref = targetLink?.getAttribute("href") ?? "#";
        const targetLabel =
          targetLink?.textContent?.trim() ??
          cells[2]?.textContent?.trim() ??
          title;

        // Cover cell: first image src
        const coverImg = cells[3]?.querySelector("img");
        const coverSrc = coverImg?.getAttribute("src") ?? "";

        const imgHtml = coverSrc
          ? `<div class="docs-card-img-wrap"><img src="${coverSrc}" alt="${title}" class="docs-card-img" /></div>`
          : "";

        cards.push(`
          <a href="${targetHref}" class="docs-card">
            ${imgHtml}
            <div class="docs-card-body">
              <span class="docs-card-title">${title}</span>
              ${desc ? `<span class="docs-card-desc">${desc}</span>` : ""}
              ${targetHref !== "#" ? `<span class="docs-card-target">${targetLabel}</span>` : ""}
            </div>
          </a>
        `);
      });

      if (cards.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "docs-cards-grid";
        wrapper.innerHTML = cards.join("");
        table.replaceWith(wrapper);
      }
    });

    // ── Inject copy buttons into code blocks ──────────────────
    const preBlocks = el.querySelectorAll<HTMLElement>("pre");
    preBlocks.forEach((pre) => {
      const code = pre.querySelector("code");
      const codeText = code?.innerText ?? pre.innerText ?? "";
      pre.style.position = "relative";

      // Remove existing copy button if any
      const existing = pre.querySelector(".docs-copy-btn");
      if (existing) existing.remove();

      const btn = document.createElement("button");
      btn.className = "docs-copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code");

      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(codeText);
          btn.textContent = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 2000);
        } catch {
          btn.textContent = "Failed";
          setTimeout(() => { btn.textContent = "Copy"; }, 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <article
      ref={ref}
      className="docs-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}