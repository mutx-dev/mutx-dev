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

function createCalloutIcon(type: string): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "docs-callout-icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");

  const addPath = (d: string, extra: Record<string, string> = {}) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    Object.entries(extra).forEach(([key, value]) => path.setAttribute(key, value));
    svg.appendChild(path);
  };

  const addCircle = () => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "8");
    circle.setAttribute("cy", "8");
    circle.setAttribute("r", "6.5");
    circle.setAttribute("stroke", "currentColor");
    circle.setAttribute("stroke-width", "1.5");
    svg.appendChild(circle);
  };

  switch (type) {
    case "warning":
      addPath("M8 2L14 13H2L8 2Z", { "stroke-linejoin": "round" });
      addPath("M8 7v3M8 11.5v.5", { "stroke-linecap": "round" });
      break;
    case "danger":
      addCircle();
      addPath("M5.5 5.5l5 5M10.5 5.5l-5 5", { "stroke-linecap": "round" });
      break;
    case "tip":
      addPath("M8 2a4 4 0 011.5 7.75L11 11l-1 .25L9.5 12H8v4", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      addPath("M6 6h.5M6 8h.5", { "stroke-linecap": "round" });
      break;
    case "note":
    default:
      addCircle();
      addPath("M8 7v4M8 5.5v.5", { "stroke-linecap": "round" });
      break;
  }

  return svg;
}

function isSafeHref(value: string | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return false;
  }
  return true;
}

export function DocsRendererClient({ html }: DocsRendererClientProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const blockquotes = el.querySelectorAll<HTMLElement>("blockquote");
    blockquotes.forEach((bq) => {
      const text = bq.textContent?.trim() ?? "";
      const calloutMatch = text.match(/^\[!([A-Z]+)(?::\s*([^\]]*))?\]\s*/i);
      if (!calloutMatch) return;

      const rawType = calloutMatch[1].toUpperCase();
      const title = calloutMatch[2] || "";
      const mappedType = CALLOUT_TYPE_MAP[rawType] ?? "note";
      const contentText = text.slice(calloutMatch[0].length).trim();

      bq.setAttribute("class", "docs-callout");
      bq.setAttribute("data-type", mappedType);
      bq.replaceChildren();
      bq.appendChild(createCalloutIcon(mappedType));

      if (title) {
        const strong = document.createElement("strong");
        strong.textContent = title;
        bq.appendChild(strong);
        if (contentText) {
          bq.appendChild(document.createTextNode(` ${contentText}`));
        }
      } else if (contentText) {
        bq.appendChild(document.createTextNode(contentText));
      }
    });

    const cardTables = el.querySelectorAll<HTMLElement>("table[data-view='cards']");
    cardTables.forEach((table) => {
      const rows = table.querySelectorAll<HTMLElement>("tbody tr");
      const cards: HTMLElement[] = [];

      rows.forEach((row, index) => {
        const cells = row.querySelectorAll<HTMLElement>("td");
        if (cells.length < 2) return;

        const titleEl = cells[0].querySelector("strong") || cells[0];
        const title = titleEl.textContent?.trim() ?? "";
        const targetLink = cells[1]?.querySelector("a");
        const rawHref = targetLink?.getAttribute("href") ?? "#";
        const normalizedHref = rawHref.replace(/\.md$/, "");
        const href = isSafeHref(normalizedHref) ? normalizedHref : "#";
        const rawLabel = targetLink?.textContent?.trim() ?? cells[1]?.textContent?.trim() ?? title;
        const targetLabel = rawLabel.replace(/\.md$/, "").trim();

        const cell1Text = cells[1]?.textContent?.trim() ?? "";
        const cell1HasOnlyLink = cell1Text === (targetLink?.textContent?.trim() ?? "");
        const desc = cell1HasOnlyLink ? "" : cell1Text.replace(/\.md$/, "").trim();

        const coverImg = cells[2]?.querySelector("img");
        const coverSrc = coverImg?.getAttribute("src");
        const safeCoverSrc = isSafeHref(coverSrc ?? null) ? coverSrc : null;

        const card = document.createElement("a");
        card.className = "docs-card";
        card.setAttribute("href", href);
        card.setAttribute("data-card-index", String(index));

        if (safeCoverSrc) {
          const wrap = document.createElement("div");
          wrap.className = "docs-card-img-wrap";
          const image = document.createElement("img");
          image.className = "docs-card-img";
          image.setAttribute("src", safeCoverSrc);
          image.setAttribute("alt", title);
          wrap.appendChild(image);
          card.appendChild(wrap);
        }

        const body = document.createElement("div");
        body.className = "docs-card-body";

        const titleNode = document.createElement("span");
        titleNode.className = "docs-card-title";
        titleNode.textContent = title;
        body.appendChild(titleNode);

        if (desc) {
          const descNode = document.createElement("span");
          descNode.className = "docs-card-desc";
          descNode.textContent = desc;
          body.appendChild(descNode);
        }

        if (href !== "#") {
          const targetNode = document.createElement("span");
          targetNode.className = "docs-card-target";
          targetNode.textContent = targetLabel;
          body.appendChild(targetNode);
        }

        card.appendChild(body);
        cards.push(card);
      });

      if (cards.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "docs-cards-grid";
        cards.forEach((card) => wrapper.appendChild(card));
        table.replaceWith(wrapper);
      }
    });

    const preBlocks = el.querySelectorAll<HTMLElement>("pre");
    preBlocks.forEach((pre) => {
      const code = pre.querySelector("code");
      const codeText = code?.innerText ?? pre.innerText ?? "";
      pre.style.position = "relative";

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
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, [html]);

  return <article ref={ref} className="docs-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
