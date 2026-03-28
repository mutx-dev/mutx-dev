import type { Metadata } from "next";
import { ArrowRight, PhoneCall } from "lucide-react";

import { ContactLeadForm } from "@/components/ContactLeadForm";
import { AuthNav } from "@/components/AuthNav";
import { CalendlyPopupButton } from "@/components/site/CalendlyPopupButton";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";

const CONTACT_EMAIL = "hello@mutx.dev";

export const metadata: Metadata = {
  title: "Contact | MUTX",
  description:
    "Contact MUTX for serious evaluations, working sessions, and direct operator conversations.",
};

export default function ContactPage() {
  return (
    <PublicSurface className={`${styles.page} ${styles.publicPage}`}>
      <AuthNav />

      <main className={styles.main}>
        <section className={styles.routeDarkSection} data-route-surface="dark">
          <div className={`${styles.shell} ${styles.routeHeroNarrow}`}>
            <div className={`${styles.routeHeroMain} ${styles.routeHeroNarrowCopy} ${styles.contactHeroMain}`}>
              <div className={`${styles.intro} ${styles.contactHeroCopy}`}>
                <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>Contact MUTX</p>
                <h1 className={`${styles.displayTitle} ${styles.darkText} ${styles.contactHeroTitle}`}>
                  Bring the rollout that needs a real answer.
                </h1>
                <p className={`${styles.bodyText} ${styles.bodyTextOnDark} ${styles.contactHeroBody}`}>
                  Use this page for a serious MUTX evaluation, a working session, or a
                  concrete operator problem.
                </p>
              </div>

              <div className={styles.ctaRow}>
                <CalendlyPopupButton className={styles.buttonPrimary}>
                  Book a call
                  <PhoneCall className="h-4 w-4" />
                </CalendlyPopupButton>
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles.buttonGhost}>
                  Email MUTX
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.routeLightSection} data-route-surface="light">
          <div className={`${styles.shell} ${styles.routeSingleColumn}`}>
            <ContactLeadForm className={styles.routeFormPanel} />
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicSurface>
  );
}
