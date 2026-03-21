import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicFooter } from '@/components/site/PublicFooter'
import { SiteReveal } from '@/components/site/SiteReveal'

export const metadata: Metadata = {
  title: 'Privacy Policy | MUTX',
  description: 'Privacy Policy for MUTX, including what data we collect, how we use it, and how to contact us about privacy matters.',
}

const sections = [
  {
    title: 'Information we collect',
    body: [
      'We may collect information you provide directly to us, such as when you join the waitlist, contact us, request updates, or interact with the MUTX website or app.',
      'We may also collect limited technical data required to operate the service, improve reliability, detect abuse, and understand how the product is being used.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      'We use collected information to operate MUTX, respond to requests, send updates you asked for, improve the product, secure the platform, and support release readiness and debugging.',
      'We do not sell personal information. We use information only to run, improve, and communicate about MUTX and closely related services.',
    ],
  },
  {
    title: 'Email and waitlist communications',
    body: [
      'If you submit your email through the waitlist or other forms, we may use it to send product updates, launch notices, technical documentation updates, and other communications directly related to MUTX.',
      'You can request removal from future communications at any time by contacting us.',
    ],
  },
  {
    title: 'Cookies and analytics',
    body: [
      'MUTX may use cookies, logs, and similar technologies to maintain sessions, secure the platform, measure usage, and improve the site and app experience.',
      'Where analytics or third-party infrastructure are used, they are used in support of operating and improving MUTX, not for unrelated advertising resale.',
    ],
  },
  {
    title: 'Sharing and disclosures',
    body: [
      'We may share information with infrastructure, hosting, email, analytics, and security providers strictly as needed to operate MUTX.',
      'We may also disclose information when required by law, to enforce our terms, or to protect users, infrastructure, or the service from abuse or security threats.',
    ],
  },
  {
    title: 'Data retention',
    body: [
      'We retain information for as long as reasonably necessary to operate MUTX, comply with legal obligations, resolve disputes, and maintain security and operational records.',
      'Retention periods may vary depending on the type of data and the operational purpose it serves.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We take reasonable technical and organizational measures to protect information, but no system can guarantee absolute security.',
      'If you believe there is a privacy or security issue involving MUTX, contact us promptly so we can investigate.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You may contact us to request access, correction, deletion, or removal from communications, subject to legal and operational limitations.',
      'If you no longer want waitlist or product emails, contact us and we will handle the request as reasonably possible.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For privacy-related questions or requests, contact the MUTX team through the project website, GitHub repository, or the primary contact methods published at mutx.dev and docs.mutx.dev.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time as MUTX evolves. When we do, we will update the effective date on this page.',
    ],
  },
] as const

export default function PrivacyPolicyPage() {
  return (
    <div className="site-page">
      <main className="site-main">
        <section className="site-section pt-20 sm:pt-24 lg:pt-28">
          <div className="site-shell space-y-8">
            <SiteReveal>
              <div className="site-section-intro">
                <div className="site-kicker">Legal</div>
                <h1 className="site-title mt-4">Privacy policy</h1>
                <p className="site-copy mt-4 max-w-3xl">
                  Effective date: March 13, 2026. This page explains how MUTX handles information across the website,
                  docs, waitlist flows, and related product surfaces.
                </p>
              </div>
            </SiteReveal>

            <SiteReveal delay={0.06}>
              <div className="site-panel-strong p-6 sm:p-8">
                <div className="space-y-10">
                  {sections.map((section) => (
                    <section key={section.title}>
                      <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
                        {section.title}
                      </h2>
                      <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--site-text-soft)] sm:text-base">
                        {section.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </SiteReveal>

            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--site-text-muted)]">
              <Link href="/" className="site-nav-link">
                Back to mutx.dev
              </Link>
              <a href="https://docs.mutx.dev" target="_blank" rel="noreferrer" className="site-nav-link">
                docs.mutx.dev
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
