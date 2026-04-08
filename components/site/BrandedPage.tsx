import type { ReactNode } from "react";

type BrandedPageProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Decorative icon name shown in the eyebrow pill */
  icon?: string;
};

export function BrandedPage({
  children,
  eyebrow,
  title,
  description,
}: BrandedPageProps) {
  return (
    <div className="bp-shell">
      {/* Atmospheric background layers */}
      <div className="bp-bg-grid" aria-hidden="true" />
      <div className="bp-bg-radials" aria-hidden="true" />

      {/* Page header */}
      <header className="bp-header">
        {eyebrow && (
          <span className="bp-eyebrow" aria-label={`Category: ${eyebrow}`}>
            {eyebrow}
          </span>
        )}
        <h1 className="bp-title">{title}</h1>
        {description && <p className="bp-description">{description}</p>}
        <div className="bp-divider" aria-hidden="true" />
      </header>

      {/* Content */}
      <div className="bp-content">{children}</div>

      <style>{`
        .bp-shell {
          position: relative;
          min-height: 100vh;
          background: #060810;
          color: #f7f4ef;
          font-family: var(--font-marketing-sans), sans-serif;
          overflow-x: clip;
        }

        .bp-bg-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.07;
          background-image:
            linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 88%);
        }

        .bp-bg-radials {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 12% 0%, rgba(91,162,255,0.2) 0%, transparent 22rem),
            radial-gradient(circle at 88% 4%, rgba(104,225,255,0.18) 0%, transparent 24rem),
            radial-gradient(circle at 52% 36%, rgba(12,20,32,0.6) 0%, transparent 56%);
        }

        .bp-header {
          position: relative;
          z-index: 1;
          padding-top: clamp(6rem, 12vw, 9rem);
          padding-bottom: clamp(2.5rem, 5vw, 4rem);
          padding-inline: clamp(1.25rem, 5vw, 2rem);
          max-width: 68rem;
          margin: 0 auto;
        }

        .bp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(104,225,255,0.22);
          background: rgba(104,225,255,0.08);
          font-family: var(--font-marketing-accent), sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(223,248,255,0.92);
          margin-bottom: 1.25rem;
        }

        .bp-title {
          margin: 0;
          font-family: var(--font-marketing-display), sans-serif;
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          font-weight: 400;
          line-height: 0.98;
          letter-spacing: -0.06em;
          color: #ffffff;
          text-wrap: balance;
        }

        .bp-description {
          margin: 1.1rem 0 0;
          font-size: clamp(0.95rem, 1.5vw, 1.05rem);
          line-height: 1.65;
          color: rgba(247,244,239,0.7);
          max-width: 48rem;
        }

        .bp-divider {
          margin-top: 2.5rem;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(104,225,255,0.28) 0%,
            rgba(104,225,255,0.06) 40%,
            transparent 100%
          );
          max-width: 32rem;
        }

        .bp-content {
          position: relative;
          z-index: 1;
          padding-inline: clamp(1.25rem, 5vw, 2rem);
          padding-bottom: clamp(4rem, 8vw, 7rem);
          max-width: 68rem;
          margin: 0 auto;
        }

        /* Prose styles for markdown content */
        .bp-content :is(h1, h2, h3, h4) {
          color: #ffffff;
          font-family: var(--font-marketing-display), sans-serif;
          letter-spacing: -0.04em;
        }

        .bp-content h1 {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 400;
          margin: 0 0 1.5rem;
          line-height: 1.05;
        }

        .bp-content h2 {
          font-size: clamp(1.3rem, 2.5vw, 1.9rem);
          font-weight: 400;
          margin: 3rem 0 1rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(247,244,239,0.08);
          color: rgba(247,244,239,0.9);
        }

        .bp-content h3 {
          font-size: clamp(1.05rem, 1.8vw, 1.35rem);
          font-weight: 600;
          margin: 2rem 0 0.75rem;
          color: rgba(247,244,239,0.95);
        }

        .bp-content p {
          font-size: clamp(0.92rem, 1.2vw, 1rem);
          line-height: 1.72;
          color: rgba(247,244,239,0.78);
          margin: 0 0 1rem;
        }

        .bp-content a {
          color: rgba(104,225,255,0.9);
          text-decoration: underline;
          text-decoration-color: rgba(104,225,255,0.3);
          text-underline-offset: 3px;
          transition: color 140ms ease, text-decoration-color 140ms ease;
        }

        .bp-content a:hover {
          color: #68e1ff;
          text-decoration-color: rgba(104,225,255,0.7);
        }

        .bp-content ul, .bp-content ol {
          padding-left: 1.4rem;
          margin: 0 0 1rem;
        }

        .bp-content li {
          font-size: clamp(0.92rem, 1.2vw, 1rem);
          line-height: 1.72;
          color: rgba(247,244,239,0.78);
          margin-bottom: 0.4rem;
        }

        .bp-content li::marker {
          color: rgba(104,225,255,0.5);
        }

        .bp-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.86em;
          background: rgba(104,225,255,0.08);
          border: 1px solid rgba(104,225,255,0.14);
          border-radius: 0.35rem;
          padding: 0.15em 0.45em;
          color: rgba(223,248,255,0.95);
        }

        .bp-content pre {
          background: #080c14;
          border: 1px solid rgba(104,225,255,0.12);
          border-radius: 1.1rem;
          padding: 1.25rem 1.4rem;
          overflow-x: auto;
          margin: 1.25rem 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .bp-content pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.88rem;
          line-height: 1.75;
          color: rgba(238,248,255,0.92);
        }

        .bp-content blockquote {
          border-left: 2px solid rgba(104,225,255,0.3);
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          color: rgba(247,244,239,0.65);
          font-style: italic;
        }

        .bp-content hr {
          border: none;
          border-top: 1px solid rgba(247,244,239,0.1);
          margin: 2.5rem 0;
        }

        .bp-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }

        .bp-content th {
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(247,244,239,0.12);
          color: rgba(247,244,239,0.5);
          font-family: var(--font-marketing-accent), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .bp-content td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(247,244,239,0.06);
          color: rgba(247,244,239,0.8);
        }

        .bp-content strong {
          font-weight: 600;
          color: rgba(247,244,239,0.92);
        }
      `}</style>
    </div>
  );
}
