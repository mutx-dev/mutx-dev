import type { Metadata } from "next";
import Link from "next/link";
import {
  AppWindow,
  ArrowRight,
  BookOpenText,
  ShieldCheck,
} from "lucide-react";

import { PublicNav } from "@/components/site/PublicNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { OperationalVisual } from "@/components/site/marketing/OperationalVisual";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  MUTX_GITHUB_RELEASES_URL,
  buildDesktopArtifactName,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";
import { buildPageMetadata, buildWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Releases | MUTX",
  description:
    "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
  ...buildPageMetadata({
    title: "Releases | MUTX",
    description:
      "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
    path: "/releases",
  }),
};

export const revalidate = 900;

type ReleaseCard = {
  title: string;
  body: string;
  href: string;
  label: string;
  icon: typeof AppWindow;
  external?: boolean;
};

const structuredData = buildWebPageStructuredData({
  name: "Releases | MUTX",
  path: "/releases",
  description: "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
});

export default async function ReleasesPage() {
  const release = await fetchLatestStableDesktopRelease();
  const version = release?.version;
  const releaseLabel = version ? `v${version}` : "Latest stable";
  const docsReleaseNotesHref = version ? buildReleaseNotesUrl(version) : "/download/macos/release-notes";
  const checksumsHref = release?.assets.checksums ?? release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL;
  const releaseHref = release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL;
  const cards: ReadonlyArray<ReleaseCard> = [
    {
      title: "Apple Silicon DMG",
      body: version
        ? `${buildDesktopArtifactName(version, "arm64-dmg")} for M-series Macs.`
        : "Latest stable Apple Silicon installer for M-series Macs.",
      href: release?.assets.arm64Dmg ?? "/download/macos/arm64",
      label: "Download arm64",
      icon: AppWindow,
      external: Boolean(release?.assets.arm64Dmg),
    },
    {
      title: "Intel Mac DMG",
      body: version
        ? `${buildDesktopArtifactName(version, "x64-dmg")} for supported Intel Macs.`
        : "Latest stable installer for supported Intel Macs.",
      href: release?.assets.x64Dmg ?? "/download/macos/intel",
      label: "Download x64",
      icon: AppWindow,
      external: Boolean(release?.assets.x64Dmg),
    },
    {
      title: "Checksums",
      body: version
        ? `${buildDesktopArtifactName(version, "checksums")} for artifact verification.`
        : "Checksums published with the latest stable release.",
      href: checksumsHref,
      label: "View checksums",
      icon: ShieldCheck,
      external: true,
    },
    {
      title: "Docs notes",
      body: "Docs-backed notes for the current desktop release.",
      href: docsReleaseNotesHref,
      label: "Read notes",
      icon: BookOpenText,
      external: true,
    },
  ];

  const artifactRows = [
    {
      label: "Apple Silicon DMG",
      value: version ? buildDesktopArtifactName(version, "arm64-dmg") : "Resolved from the stable release channel",
    },
    {
      label: "Intel Mac DMG",
      value: version ? buildDesktopArtifactName(version, "x64-dmg") : "Resolved from the stable release channel",
    },
    {
      label: "Apple Silicon ZIP",
      value: version ? buildDesktopArtifactName(version, "arm64-zip") : "Resolved from the stable release channel",
    },
    {
      label: "Intel Mac ZIP",
      value: version ? buildDesktopArtifactName(version, "x64-zip") : "Resolved from the stable release channel",
    },
    {
      label: "Checksums",
      value: version ? buildDesktopArtifactName(version, "checksums") : "Published with the stable release",
    },
  ] as const;

  const shippedSurfaces = [
    "Signed Mac release for Apple Silicon and Intel.",
    "Docs notes, checksums, and GitHub point at the same build.",
    "Preview surfaces stay out of the primary release lane.",
  ] as const;

  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage} ${styles.releasesPage}`}>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main id="main-content" className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={styles.shell}>
            <div className={styles.routeDownloadStage}>
              <div className={`${styles.routeHeroMain} ${styles.routeDownloadCopy}`}>
                <div className={styles.intro}>
                  <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Release lane</p>
                  <h1 className={`${styles.displayTitle} ${styles.darkText}`}>
                    MUTX <span className={styles.releaseVersion}>{releaseLabel}</span>
                    <span className={styles.displayAccent}>Signed desktop release.</span>
                  </h1>
                  <p className={`${styles.bodyText} ${styles.bodyTextOnDark}`}>
                    Current signed Mac release, checksums, docs notes, and GitHub tag.
                  </p>
                </div>

                <div className={styles.ctaRow}>
                  <Link href="/download" className={styles.buttonPrimary}>
                    Open Mac downloads
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href={releaseHref} target="_blank" rel="noopener noreferrer" className={styles.buttonGhost}>
                    GitHub release
                  </a>
                </div>

                <div className={styles.routeDownloadMeta}>
                  <p className={styles.routeDownloadMetaItem}>
                    Current stable release: <span>{releaseLabel}</span>
                  </p>
                  <Link href="/download" className={styles.inlineLink}>
                    Download lane
                  </Link>
                  <a href={docsReleaseNotesHref} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                    Docs notes
                  </a>
                  <a href={releaseHref} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                    GitHub release
                  </a>
                </div>
              </div>

              <div className={styles.routeVisualFrame}>
                <OperationalVisual variant="release" />
              </div>
            </div>

            <div className={`${styles.routeReleaseBand} ${styles.routeHeroPanel}`}>
              <div className={styles.routeReleaseBandCopy}>
                <div className={styles.intro}>
                  <p className={styles.eyebrow}>What ships now</p>
                  <h2 className={styles.sectionTitle}>One release lane.</h2>
                  <p className={styles.bodyText}>
                    Downloads, notes, checksums, and the GitHub tag all point at the same build.
                  </p>
                </div>
              </div>

              <div className={styles.routeReleaseSignalGrid}>
                {shippedSurfaces.map((item) => (
                  <p key={item} className={`${styles.surfaceListItem} ${styles.surfaceListItemDark}`}>
                    {item}
                  </p>
                ))}
              </div>

              <div className={styles.utilityLinks}>
                <Link href="/dashboard" className={styles.inlineLink}>
                  Open dashboard
                </Link>
                <a href={docsReleaseNotesHref} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                  Docs notes
                </a>
                <a href={releaseHref} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                  GitHub release
                </a>
                <a href={MUTX_GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                  All releases
                </a>
              </div>
            </div>

            <div className={`${styles.routeDownloadCards} ${styles.routeReleaseCards}`} data-testid="releases-download-cards">
                {cards.map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    target={card.external ? "_blank" : undefined}
                    rel={card.external ? "noreferrer" : undefined}
                    className={`${styles.panel} ${styles.panelDark} ${styles.panelPadded} ${styles.routeCard} ${styles.routeDownloadCard}`}
                  >
                    <div className={styles.routeCardIcon}>
                      <card.icon className="h-4 w-4" />
                    </div>
                    <h3 className={styles.routeCardTitle}>{card.title}</h3>
                    <p className={styles.bodyText}>{card.body}</p>
                    <span className={styles.inlineLink}>
                      {card.label}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                ))}
            </div>

            <div className={styles.routeReleaseArtifactRow}>
              <aside className={`${styles.panel} ${styles.panelDark} ${styles.panelPadded} ${styles.routeArtifactPanel}`}>
                <div className={styles.intro}>
                  <p className={styles.eyebrow}>Artifact contract</p>
                  <h2 className={styles.sectionTitle}>Release files</h2>
                  <p className={styles.bodyText}>
                    DMGs, ZIPs, and one checksum file for the current desktop release.
                  </p>
                </div>

                <div className={`${styles.routeMetaList} ${styles.routeArtifactList}`}>
                  {artifactRows.map((row) => (
                    <div key={row.label} className={styles.routeMetaItem}>
                      <p className={styles.routeMetaLabel}>{row.label}</p>
                      <p className={styles.routeMetaValue}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
