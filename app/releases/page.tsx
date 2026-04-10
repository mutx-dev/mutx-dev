import type { Metadata } from "next";
import Image from "next/image";
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
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  MUTX_GITHUB_RELEASES_URL,
  buildDesktopArtifactName,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Releases | MUTX",
  description:
    "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
  alternates: {
    canonical: getCanonicalUrl("/releases"),
  },
  openGraph: {
    title: "Releases | MUTX",
    description:
      "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
    url: getCanonicalUrl("/releases"),
    images: [getPageOgImageUrl("Releases | MUTX", "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.", { path: "/releases" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "Releases | MUTX",
    description:
      "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
    images: [getPageOgImageUrl("Releases | MUTX", "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.", { path: "/releases" })],
  },
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

export default async function ReleasesPage() {
  const release = await fetchLatestStableDesktopRelease();
  const version = release?.version ?? "1.3.0";
  const releaseLabel = `v${version}`;
  const docsReleaseNotesHref = buildReleaseNotesUrl(version);
  const checksumsHref = release?.assets.checksums ?? release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL;
  const releaseHref = release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL;
  const cards: ReadonlyArray<ReleaseCard> = [
    {
      title: "Apple Silicon DMG",
      body: `${buildDesktopArtifactName(version, "arm64-dmg")} for M-series Macs.`,
      href: release?.assets.arm64Dmg ?? "/download/macos/arm64",
      label: "Download arm64",
      icon: AppWindow,
      external: Boolean(release?.assets.arm64Dmg),
    },
    {
      title: "Intel Mac DMG",
      body: `${buildDesktopArtifactName(version, "x64-dmg")} for Intel hardware that still needs a supported MUTX lane.`,
      href: release?.assets.x64Dmg ?? "/download/macos/intel",
      label: "Download x64",
      icon: AppWindow,
      external: Boolean(release?.assets.x64Dmg),
    },
    {
      title: "Checksums",
      body: `${buildDesktopArtifactName(version, "checksums")} for artifact verification and rollout checks.`,
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
      value: buildDesktopArtifactName(version, "arm64-dmg"),
    },
    {
      label: "Intel Mac DMG",
      value: buildDesktopArtifactName(version, "x64-dmg"),
    },
    {
      label: "Apple Silicon ZIP",
      value: buildDesktopArtifactName(version, "arm64-zip"),
    },
    {
      label: "Intel Mac ZIP",
      value: buildDesktopArtifactName(version, "x64-zip"),
    },
    {
      label: "Checksums",
      value: buildDesktopArtifactName(version, "checksums"),
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

      <main className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={styles.shell}>
            <div className={styles.routeDownloadStage}>
              <div className={`${styles.routeHeroMain} ${styles.routeDownloadCopy}`}>
                <div className={styles.intro}>
                  <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Release lane</p>
                  <h1 className={`${styles.displayTitle} ${styles.darkText}`}>
                    MUTX {releaseLabel}
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
                  <a href={releaseHref} target="_blank" rel="noreferrer" className={styles.buttonGhost}>
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
                  <a href={docsReleaseNotesHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Docs notes
                  </a>
                  <a href={releaseHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    GitHub release
                  </a>
                </div>
              </div>

              <div className={styles.routeVisualFrame}>
                <div className={styles.routeVisualGlow} aria-hidden="true" />
                <Image
                  src="/landing/webp/running-agent.webp"
                  alt="MUTX runtime scene showing the operator lane in motion"
                  fill
                  sizes="(max-width: 1024px) 100vw, 34rem"
                  className={styles.routeVisualImage}
                />
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
                <a href={docsReleaseNotesHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                  Docs notes
                </a>
                <a href={releaseHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                  GitHub release
                </a>
                <a href={MUTX_GITHUB_RELEASES_URL} target="_blank" rel="noreferrer" className={styles.inlineLink}>
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
