import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/site/PublicNav";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl, getPageOgImageUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy | MUTX",
  description:
    "How MUTX handles data across the site, downloads, docs, and support surfaces.",
  alternates: { canonical: getCanonicalUrl("/privacy-policy") },
  openGraph: {
    title: "Privacy Policy | MUTX",
    description:
      "How MUTX handles data across the site, downloads, docs, and support surfaces.",
    url: getCanonicalUrl("/privacy-policy"),
    images: [getPageOgImageUrl("Privacy Policy | MUTX", undefined, { path: "/privacy-policy" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "Privacy Policy | MUTX",
    description:
      "How MUTX handles data across the site, downloads, docs, and support surfaces.",
    images: [getPageOgImageUrl("Privacy Policy | MUTX", undefined, { path: "/privacy-policy" })],
  },
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We may collect information you provide directly to us, such as when you contact us, request updates, download MUTX, or interact with the MUTX website or app.",
      "We may also collect limited technical data required to operate the service, improve reliability, detect abuse, and understand how the product is being used.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use collected information to operate MUTX, respond to requests, send updates you asked for, improve the product, secure the platform, and support release readiness and debugging.",
      "We do not sell personal information. We use information only to run, improve, and communicate about MUTX and closely related services.",
    ],
  },
  {
    title: "Email and product communications",
    body: [
      "If you submit your email through contact or product forms, we may use it to send product updates, release notices, technical documentation updates, and other communications directly related to MUTX.",
      "You can request removal from future communications at any time by contacting us.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "MUTX may use cookies, logs, and similar technologies to maintain sessions, secure the platform, measure usage, and improve the site and app experience.",
      "Where analytics or third-party infrastructure are used, they are used in support of operating and improving MUTX, not for unrelated advertising resale.",
    ],
  },
  {
    title: "Sharing and disclosures",
    body: [
      "We may share information with infrastructure, hosting, email, analytics, and security providers strictly as needed to operate MUTX.",
      "We may also disclose information when required by law, to enforce our terms, or to protect users, infrastructure, or the service from abuse or security threats.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "We retain information for as long as reasonably necessary to operate MUTX, comply with legal obligations, resolve disputes, and maintain security and operational records.",
      "Retention periods may vary depending on the type of data and the operational purpose it serves.",
    ],
  },
  {
    title: "Security",
    body: [
      "We take reasonable technical and organizational measures to protect information, but no system can guarantee absolute security.",
      "If you believe there is a privacy or security issue involving MUTX, contact us promptly so we can investigate.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You may contact us to request access, correction, deletion, or removal from communications, subject to legal and operational limitations.",
      "If you no longer want product emails, contact us and we will handle the request as reasonably possible.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy-related questions or requests, contact the MUTX team through the project website, GitHub repository, or the primary contact methods published at mutx.dev and docs.mutx.dev.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time as MUTX evolves. When we do, we will update the effective date on this page.",
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage}`}>
      <PublicNav />

      <main className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={`${styles.shell} ${styles.routeHeroCopy} ${styles.routeHeroNarrow} ${styles.routeHeroNarrowCopy}`}>
            <div className={styles.intro}>
              <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Legal</p>
              <h1 className={`${styles.displayTitle} ${styles.darkText}`}>Privacy policy</h1>
              <p className={`${styles.bodyText} ${styles.bodyTextOnDark}`}>
                Effective date: March 13, 2026. How MUTX handles site, download,
                docs, and support data.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.routeLightSection} data-route-surface="light">
          <div className={`${styles.shell} ${styles.routeLegalGrid}`}>
            <div className={`${styles.panel} ${styles.prosePanel}`}>
              {sections.map((section) => (
                <section key={section.title} className={styles.proseSection}>
                  <h2>{section.title}</h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>

            <aside className={`${styles.panel} ${styles.panelPadded} ${styles.routeMetaPanel}`}>
              <div className={styles.intro}>
                <p className={styles.eyebrow}>Legal scope</p>
                <h2 className={styles.sectionTitle}>Site policy.</h2>
                <p className={styles.bodyText}>
                  Covers mutx.dev, downloads, docs, and support communication.
                </p>
              </div>

              <div className={styles.routeMetaList}>
                <div className={styles.routeMetaItem}>
                  <p className={styles.routeMetaLabel}>Effective date</p>
                  <p className={styles.routeMetaValue}>March 13, 2026</p>
                </div>
                <div className={styles.routeMetaItem}>
                  <p className={styles.routeMetaLabel}>Contact</p>
                  <p className={styles.routeMetaValue}>hello@mutx.dev</p>
                </div>
                <div className={styles.routeMetaItem}>
                  <p className={styles.routeMetaLabel}>Related links</p>
                  <p className={styles.routeMetaValue}>
                    <Link href="/" className={styles.inlineLink}>
                      mutx.dev
                    </Link>
                  </p>
                  <p className={styles.routeMetaValue}>
                    <a
                      href="https://docs.mutx.dev"
                      target="_blank"
                      rel="noreferrer"
                      className={styles.inlineLink}
                    >
                      docs.mutx.dev
                    </a>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicSurface>
  );
}
