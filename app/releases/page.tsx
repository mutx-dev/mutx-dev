import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AppWindow,
  ArrowRight,
  BookOpenText,
  Github,
  ShieldCheck,
} from "lucide-react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  MUTX_GITHUB_RELEASES_URL,
  buildDesktopArtifactName,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";

export const metadata: Metadata = {
  title: "Releases | MUTX",
  description:
    "Current MUTX desktop release, signed macOS downloads, checksums, GitHub tag, and docs-backed release notes.",
};

export const dynamic = "force-dynamic";

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
      title: "GitHub release",
      body: "Tagged assets, provenance, and the release payload on GitHub Releases.",
      href: releaseHref,
      label: "Open GitHub",
      icon: Github,
      external: true,
    },
    {
      title: "Docs release notes",
      body: "Repo-backed release narrative synced to docs.mutx.dev for the current launch.",
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
    "Signed and notarized macOS app for Apple Silicon and Intel.",
    "Stable browser dashboard lane for supported operator routes.",
    "Docs-backed release notes plus GitHub-hosted assets and checksums.",
    "Preview control demo kept out of the primary stable navigation.",
  ] as const;

  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage}`}>
      <AuthNav />

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
                    This page is the public release summary for the current MUTX operator
                    build: notarized Mac downloads, checksums, GitHub tag, and the
                    docs-backed release notes that describe what actually ships.
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
                  <a href={checksumsHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Checksums
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

            <div className={styles.routeDownloadLowerGrid}>
              <div className={`${styles.routeDownloadStrip} ${styles.routeHeroPanel}`}>
                <div className={styles.routeDownloadStripCopy}>
                  <div className={styles.intro}>
                    <p className={styles.eyebrow}>What ships now</p>
                    <h2 className={styles.sectionTitle}>One public story for the operator app.</h2>
                    <p className={styles.bodyText}>
                      The marketing site, docs, and GitHub release now point at the same
                      artifact set. Download routes resolve to the current stable Mac
                      assets, release notes live on the docs surface, and GitHub stays
                      the distribution source of truth.
                    </p>
                  </div>
                </div>

                <div className={styles.surfaceList}>
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
                    Docs release notes
                  </a>
                  <a href={MUTX_GITHUB_RELEASES_URL} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    All releases
                  </a>
                </div>
              </div>

              <div className={styles.routeDownloadCards} data-testid="releases-download-cards">
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
            </div>
          </div>
        </section>

        <section className={styles.routeLightSection} data-route-surface="light">
          <div className={styles.shell}>
            <div className={styles.splitGrid}>
              <aside className={`${styles.panel} ${styles.panelPadded} ${styles.routeMetaPanel}`}>
                <div className={styles.intro}>
                  <p className={styles.eyebrow}>Artifact contract</p>
                  <h2 className={styles.sectionTitle}>Release files</h2>
                  <p className={styles.bodyText}>
                    The current desktop release publishes both macOS architectures, both
                    ZIPs, and one checksum file for rollout verification.
                  </p>
                </div>

                <div className={styles.routeMetaList}>
                  {artifactRows.map((row) => (
                    <div key={row.label} className={styles.routeMetaItem}>
                      <p className={styles.routeMetaLabel}>{row.label}</p>
                      <p className={styles.routeMetaValue}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <div className={`${styles.panel} ${styles.prosePanel}`}>
                <section className={styles.proseSection}>
                  <h2>Release scope</h2>
                  <p>
                    MUTX {releaseLabel} makes the Mac app the primary signed operator
                    surface, keeps the browser dashboard in the stable route lane, and
                    preserves the control demo as preview instead of pretending every
                    browser path is equally mature.
                  </p>
                </section>

                <section className={styles.proseSection}>
                  <h2>Distribution truth</h2>
                  <p>
                    Use <strong>mutx.dev/download</strong> for the first-party
                    Mac handoff, <strong>mutx.dev/releases</strong> for the public
                    release summary, <strong>docs.mutx.dev</strong> for the repo-backed
                    release notes, and GitHub Releases for the attached artifacts.
                  </p>
                </section>

                <section className={styles.proseSection}>
                  <h2>Supported versus preview</h2>
                  <p>
                    The signed desktop app, the public site, the docs surface, and the
                    stable browser dashboard routes are the supported v1.3.0 operator
                    story. <code>app.mutx.dev/control/*</code> and explicitly
                    preview-backed dashboard routes remain preview.
                  </p>
                </section>

                <div className={styles.utilityLinks}>
                  <Link href="/download" className={styles.inlineLink}>
                    Mac downloads
                  </Link>
                  <a href={docsReleaseNotesHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Docs notes
                  </a>
                  <a href={releaseHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    GitHub release
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
