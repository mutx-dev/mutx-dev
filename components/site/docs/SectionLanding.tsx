"use client";

import Link from "next/link";
import { DocNavItem } from "@/lib/docs";

interface SectionLandingProps {
  title: string;
  description?: string;
  children: DocNavItem[];
}

export function SectionLanding({
  title,
  description,
  children,
}: SectionLandingProps) {
  if (children.length === 0) return null;

  return (
    <div className="docs-section-landing">
      {title && <h1 className="docs-section-landing-title">{title}</h1>}
      {description && (
        <p className="docs-section-landing-desc">{description}</p>
      )}
      <div className="docs-section-grid">
        {children.map((child) => (
          <Link
            key={child.slug}
            href={`/docs/${child.slug}`}
            className="docs-section-card"
          >
            <span className="docs-section-card-title">{child.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
