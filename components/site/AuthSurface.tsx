import Image from "next/image";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/site/PublicFooter";

type AuthSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideEyebrow: string;
  asideTitle: string;
  asideBody: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaWidth: number;
  mediaHeight: number;
  highlights: readonly string[];
  children: ReactNode;
};

export function AuthSurface({
  eyebrow,
  title,
  description,
  asideEyebrow,
  asideTitle,
  asideBody,
  mediaSrc,
  mediaAlt,
  mediaWidth,
  mediaHeight,
  highlights,
  children,
}: AuthSurfaceProps) {
  return (
    <div className="site-page">
      <main className="site-main">
        <section className="site-section pt-20 sm:pt-24 lg:pt-28">
          <div className="site-shell">
            <div className="site-auth-grid">
              <div className="space-y-6">
                <div className="max-w-2xl">
                  <div className="site-kicker">{eyebrow}</div>
                  <h1 className="site-title mt-4">{title}</h1>
                  <p className="site-copy mt-4 max-w-xl">{description}</p>
                </div>

                <div className="site-form-card p-6 sm:p-8">{children}</div>
              </div>

              <aside className="site-auth-aside">
                <div className="site-auth-media">
                  <Image
                    src={mediaSrc}
                    alt={mediaAlt}
                    width={mediaWidth}
                    height={mediaHeight}
                    sizes="(max-width: 1024px) 100vw, 34rem"
                    className="site-auth-media-image"
                  />
                </div>

                <div className="site-panel p-5 sm:p-6">
                  <div className="site-kicker">{asideEyebrow}</div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                    {asideTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
                    {asideBody}
                  </p>

                  <div className="mt-5 grid gap-3">
                    {highlights.map((item) => (
                      <div key={item} className="site-inline-card">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
