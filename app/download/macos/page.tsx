import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, ShieldCheck } from "lucide-react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  MUTX_GITHUB_RELEASES_URL,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";
import { getCanonicalUrl } from "@/lib/seo";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Download for macOS | MUTX",
  description:
    "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.",
  alternates: {
    canonical: getCanonicalUrl("/download"),
  },
  openGraph: {
    title: "Download for macOS | MUTX",
    description:
      "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.",
    url: getCanonicalUrl("/download"),
  },
};

export default async function MacDownloadPage() {
  const release = await fetchLatestStableDesktopRelease();
  const releaseLabel = release ? `v${release.version}` : "the latest stable GitHub release";
  const checksumsHref = release?.assets.checksums ?? release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL;
  const docsReleaseNotesHref = release ? buildReleaseNotesUrl(release.version) : "/download/macos/release-notes";
  const arm64Href = release?.assets.arm64Dmg ?? "/download/macos/arm64";
  const intelHref = release?.assets.x64Dmg ?? "/download/macos/intel";

  const cards: ReadonlyArray<{
    title: string;
    body: string;
    href: string;
    icon: typeof BookOpenText;
    label: string;
    external?: boolean;
  }> = [
    {
      title: "Release summary",
      body: "Current version, public download lane, notes, and checksums in one place.",
      href: "/releases",
      icon: BookOpenText,
      label: "Open release summary",
    },
    {
      title: "Docs notes",
      body: "Docs-backed notes for the current desktop build.",
      href: docsReleaseNotesHref,
      icon: BookOpenText,
      label: "Read docs notes",
      external: true,
    },
    {
      title: "Checksums",
      body: "SHA-256 file for rollout verification.",
      href: checksumsHref,
      icon: ShieldCheck,
      label: "View checksums",
      external: true,
    },
  ];

  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage} ${styles.downloadPage}`}>
      <AuthNav />

      <main className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={styles.shell}>
            <div className={styles.routeDownloadStage}>
              <div className={`${styles.routeHeroMain} ${styles.routeDownloadCopy}`}>
                <div className={styles.intro}>
                  <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Desktop release</p>
                  <h1 className={`${styles.displayTitle} ${styles.darkText}`}>
                    Download MUTX for macOS.
                  </h1>
                  <p className={`${styles.bodyText} ${styles.bodyTextOnDark}`}>
                    MUTX {releaseLabel} is the signed macOS operator app for Apple Silicon
                    and Intel. Install it, then move straight into the dashboard.
                  </p>
                </div>

                <div className={styles.ctaRow}>
                  <a
                    href={arm64Href}
                    target={release?.assets.arm64Dmg ? "_blank" : undefined}
                    rel={release?.assets.arm64Dmg ? "noreferrer" : undefined}
                    className={styles.buttonPrimary}
                  >
                    Download for Apple Silicon
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={intelHref}
                    target={release?.assets.x64Dmg ? "_blank" : undefined}
                    rel={release?.assets.x64Dmg ? "noreferrer" : undefined}
                    className={styles.buttonGhost}
                  >
                    Download for Intel Mac
                  </a>
                </div>

                <div className={styles.routeDownloadMeta}>
                  <p className={styles.routeDownloadMetaItem}>
                    Signed and notarized release: <span>{releaseLabel}</span>
                  </p>
                  <Link href="/releases" className={styles.inlineLink}>
                    Release summary
                  </Link>
                  <a href={docsReleaseNotesHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Docs notes
                  </a>
                  <a href={checksumsHref} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Checksums
                  </a>
                  <a href={release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    GitHub release
                  </a>
                </div>
              </div>

              <div className={styles.routeVisualFrame}>
                <div className={styles.routeVisualGlow} aria-hidden="true" />
                <Image
                  src="/landing/webp/victory-core.webp"
                  alt="MUTX robot presenting the MUTX mark"
                  fill
                  sizes="(max-width: 1024px) 100vw, 34rem"
                  className={styles.routeVisualImage}
                />
              </div>
            </div>

            <div className={`${styles.routeReleaseBand} ${styles.routeHeroPanel}`}>
              <div className={styles.routeReleaseBandCopy}>
                <div className={styles.intro}>
                  <p className={styles.eyebrow}>Stable operator lane</p>
                  <h2 className={styles.sectionTitle}>Mac app first.</h2>
                  <p className={styles.bodyText}>
                    Downloads, notes, and checksums stay in one public lane.
                  </p>
                </div>
              </div>

              <div className={styles.routeReleaseSignalGrid}>
                <p className={`${styles.surfaceListItem} ${styles.surfaceListItemDark}`}>
                  Signed builds for Apple Silicon and Intel.
                </p>
                <p className={`${styles.surfaceListItem} ${styles.surfaceListItemDark}`}>
                  Release summary, notes, and checksums stay aligned.
                </p>
                <p className={`${styles.surfaceListItem} ${styles.surfaceListItemDark}`}>
                  Install once, then move into the dashboard.
                </p>
              </div>

              <div className={styles.utilityLinks}>
                <Link href="/dashboard" className={styles.inlineLink}>
                  Open dashboard
                </Link>
                <Link href="/login" className={styles.inlineLink}>
                  Sign in
                </Link>
                <a href={release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                  GitHub release
                </a>
              </div>
            </div>

            <div className={styles.routeDownloadCards}>
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
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
