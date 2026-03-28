import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AppWindow, FileCheck2, Github, ShieldCheck } from "lucide-react";

import { AuthNav } from "@/components/AuthNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  MUTX_GITHUB_RELEASES_URL,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";

export const dynamic = "force-dynamic";

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
    icon: typeof AppWindow;
    label: string;
    external?: boolean;
  }> = [
    {
      title: "Apple Silicon",
      body: "Download the current signed and notarized build for M-series Macs.",
      href: arm64Href,
      icon: AppWindow,
      label: "Download arm64",
      external: Boolean(release?.assets.arm64Dmg),
    },
    {
      title: "Intel Mac",
      body: "Use the x64 build if the operator machine is still on Intel hardware.",
      href: intelHref,
      icon: AppWindow,
      label: "Download x64",
      external: Boolean(release?.assets.x64Dmg),
    },
    {
      title: "Release summary",
      body: "See the current MUTX release page with download lanes, checksums, and shipped-surface notes.",
      href: "/releases",
      icon: FileCheck2,
      label: "Read release",
    },
    {
      title: "Checksums",
      body: "Verify the release asset against the published SHA-256 file before rollout.",
      href: checksumsHref,
      icon: ShieldCheck,
      label: "View checksums",
      external: true,
    },
    {
      title: "GitHub release",
      body: "Inspect tagged assets, release notes, and artifact history on GitHub.",
      href: release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL,
      icon: Github,
      label: "View release",
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
                    MUTX {releaseLabel} is the signed and notarized desktop operator app.
                    Pick Apple Silicon or Intel, install once, then move straight into the
                    dashboard and runtime lane.
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
                  <a
                    href="https://docs.mutx.dev"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inlineLink}
                  >
                    Docs
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

            <div className={styles.routeDownloadLowerGrid}>
              <div className={`${styles.routeDownloadStrip} ${styles.routeHeroPanel}`}>
                <div className={styles.routeDownloadStripCopy}>
                  <div className={styles.intro}>
                    <p className={styles.eyebrow}>Stable operator lane</p>
                    <h2 className={styles.sectionTitle}>One installer. One operator path.</h2>
                    <p className={styles.bodyText}>
                      The Mac app is the primary operator surface. These routes resolve to
                      the current stable release assets, checksum file, release summary,
                      and docs-backed release notes without detouring through a fake
                      handoff.
                    </p>
                  </div>
                </div>
                <div className={styles.utilityLinks}>
                  <Link href="/releases" className={styles.inlineLink}>
                    Release summary
                  </Link>
                  <Link href="/dashboard" className={styles.inlineLink}>
                    Open dashboard
                  </Link>
                  <Link href="/login" className={styles.inlineLink}>
                    Sign in
                  </Link>
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
          </div>
        </section>
      </main>

      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
