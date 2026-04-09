"use client";

import Link from "next/link";
import { DocNavItem } from "@/lib/docs";

interface SectionLandingProps {
  title: string;
  description?: string;
  children: DocNavItem[];
  headingLevel?: 1 | 2 | 3;
}

export function SectionLanding({
  title,
  description,
  children,
  headingLevel = 2,
}: SectionLandingProps) {
  if (children.length === 0) return null;

  return (
    <div className="docs-section-landing">
      {title &&
        (headingLevel === 1 ? (
          <h1 className="docs-section-landing-title">{title}</h1>
        ) : headingLevel === 3 ? (
          <h3 className="docs-section-landing-title">{title}</h3>
        ) : (
          <h2 className="docs-section-landing-title">{title}</h2>
        ))}
      {description && (
        <p className="docs-section-landing-desc">{description}</p>
      )}
      <div className="docs-section-grid">
        {children.map((child) => (
          <Link
            key={child.route}
            href={child.route}
            className="docs-section-card"
          >
            <span className="docs-section-card-title">{child.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
