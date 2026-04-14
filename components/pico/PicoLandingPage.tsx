'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '@/components/site/SiteReveal'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'

const HOW_ICONS = ['path', 'support', 'shield', 'expert'] as const
const ATLAS_ROUTES = [
  {
    href: '/pico/onboarding',
    chapter: '01',
    title: 'Onboarding',
    note: 'first visible win',
    body: 'Get Hermes open, run one bounded prompt, and capture one proof artifact before the world gets noisy.',
  },
  {
    href: '/pico/academy',
    chapter: '02',
    title: 'Academy',
    note: 'brief, deliverable, critique',
    body: 'Follow the route lesson by lesson with a studio-style brief and a real validation line.',
  },
  {
    href: '/pico/tutor',
    chapter: '03',
    title: 'Tutor',
    note: 'grounded critique desk',
    body: 'Bring one blocker, leave with one next move, and go back into motion immediately.',
  },
  {
    href: '/pico/autopilot',
    chapter: '04',
    title: 'Autopilot',
    note: 'live control room',
    body: 'Read the run, the budget line, and the approval gate before you trust the automation.',
  },
  {
    href: '/pico/support',
    chapter: '05',
    title: 'Support',
    note: 'the messy edge',
    body: 'Escalate with a clean packet when the product path stops being honest enough on its own.',
  },
] as const

const HERO_METHOD = [
  {
    label: '01',
    title: 'Brief',
    body: 'Start with one exact outcome and one visible finish line.',
  },
  {
    label: '02',
    title: 'Deliverable',
    body: 'Every chapter ends with an artifact, not a vague feeling of progress.',
  },
  {
    label: '03',
    title: 'Critique',
    body: 'Tutor, Autopilot, and Support exist to sharpen the next move fast.',
  },
] as const

const HERO_LEDGER = [
  {
    label: 'Five authored rooms',
    body: 'Onboarding, Academy, Tutor, Autopilot, and Support all behave like one system.',
  },
  {
    label: 'One proof per chapter',
    body: 'The learning path only counts when the route leaves behind evidence.',
  },
  {
    label: 'Human help at the edge',
    body: 'The product should carry the load until the messy edge is real.',
  },
] as const

function HowItWorksIcon({ kind }: { kind: string }) {
  const sz = 20
  const clr = 'currentColor'
  switch (kind) {
    case 'path':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'support':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'shield':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'expert':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    default:
      return null
  }
}

export function PicoLandingPage() {
  const t = useTranslations('pico')
  const prefersReducedMotion = useReducedMotion()
  const [formOpen, setFormOpen] = useState(false)
  const [formInterest, setFormInterest] = useState<string | undefined>()

  const openForm = useCallback((interest?: string) => {
    setFormInterest(interest)
    setFormOpen(true)
  }, [])

  return (
    <div data-testid="pico-waitlist-landing" className={s.page}>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={formInterest}
      />

      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/pico" className={s.navBrand}>
            <span className={s.navLogo}>
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={32} height={32} priority />
            </span>
            <span className={s.navName}>
              {t('nav.brand')}
              <span className={s.navTag}>{t('nav.brandTag')}</span>
            </span>
          </Link>
          <div className={s.navActions}>
            <PicoLangSwitcher />
            <button className={s.navCta} onClick={() => openForm()} type="button">
              {t('nav.cta')}
            </button>
          </div>
        </div>
      </nav>

      <main className={s.main}>
        <section className={s.hero}>
          <div className={s.heroAmbient} aria-hidden="true" />
          <div className={s.heroGrid}>
            <div className={s.heroCopy}>
              <SiteReveal delay={0.05}>
                <span className={s.heroBadge}>{t('hero.badge')}</span>
              </SiteReveal>

              <SiteReveal delay={0.1}>
                <h1 className={s.heroTitle}>
                  {t('hero.title')}
                  <span className={s.heroTitleAccent}>{t('hero.titleAccent')}</span>
                </h1>
              </SiteReveal>

              <SiteReveal delay={0.16}>
                <p className={s.heroSub}>{t('hero.subtitle')}</p>
              </SiteReveal>

              <SiteReveal delay={0.22}>
                <div className={s.heroActions}>
                  <button
                    onClick={() => openForm('guided atlas preview')}
                    className={s.btnPrimary}
                    type="button"
                  >
                    Enter the atlas
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => openForm()} className={s.btnSecondary} type="button">
                    {t('hero.cta')}
                  </button>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.26}>
                <p className={s.heroMeta}>
                  Pico behaves like a studio learning product when every room has one job, one tone,
                  and one irreversible next move.
                </p>
              </SiteReveal>

              <SiteReveal delay={0.3}>
                <div className={s.heroLedger}>
                  {HERO_LEDGER.map((item) => (
                    <div key={item.label} className={s.heroLedgerItem}>
                      <p className={s.heroLedgerLabel}>{item.label}</p>
                      <p className={s.heroLedgerBody}>{item.body}</p>
                    </div>
                  ))}
                </div>
              </SiteReveal>

              <SiteReveal delay={0.34}>
                <div className={s.trustBar}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={s.trustItem}>
                      {i > 0 && <span className={s.trustSep} aria-hidden="true">|</span>}
                      {t(`trustBar.items.${i}`)}
                    </span>
                  ))}
                </div>
              </SiteReveal>
            </div>

            <div className={s.heroStage}>
              <SiteReveal delay={0.2}>
                <div className={s.heroStageTop}>
                  <div className={s.heroMethodCard}>
                    <div className={s.heroCardHeader}>
                      <span className={s.heroCardEyebrow}>Studio method</span>
                      <span className={s.heroCardChip}>brief / deliverable / critique</span>
                    </div>
                    <p className={s.heroCardTitle}>Learn the product the way a serious studio would teach it.</p>
                    <div className={s.heroMethodList}>
                      {HERO_METHOD.map((item) => (
                        <div key={item.label} className={s.heroMethodItem}>
                          <span className={s.heroMethodIndex}>{item.label}</span>
                          <div>
                            <p className={s.heroMethodTitle}>{item.title}</p>
                            <p className={s.heroMethodBody}>{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={s.heroRouteCard}>
                    <div className={s.heroCardHeader}>
                      <span className={s.heroCardEyebrow}>Atlas rooms</span>
                      <span className={s.heroCardChip}>all paths live</span>
                    </div>
                    <div className={s.heroRouteList}>
                      {ATLAS_ROUTES.map((route) => (
                        <button
                          key={route.href}
                          className={s.heroRouteRow}
                          onClick={() => openForm(route.title)}
                          type="button"
                        >
                          <span className={s.heroRouteChapter}>{route.chapter}</span>
                          <div className={s.heroRouteMeta}>
                            <p className={s.heroRouteTitle}>{route.title}</p>
                            <p className={s.heroRouteNote}>{route.note}</p>
                          </div>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.36}>
                <motion.div
                  className={s.heroVisual}
                  whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={s.terminal} aria-hidden="true">
                    <div className={s.terminalBar}>
                      <span className={s.terminalDot} style={{ background: 'var(--pico-red)' }} />
                      <span className={s.terminalDot} style={{ background: 'var(--pico-yellow)' }} />
                      <span className={s.terminalDot} style={{ background: 'var(--pico-accent)' }} />
                      <span className={s.terminalTitle}>pico.mutx.dev / operator atlas</span>
                    </div>
                    <div className={s.terminalBody}>
                      <div className={s.terminalLine}>
                        <span className={s.tGreen}>MISSION</span>
                        <span className={s.tDim}>//</span>
                        <span className={s.tWhite}>ship the first working agent before the room gets noisy</span>
                      </div>
                      <div className={s.terminalLine}>
                        <span className={s.tMuted}>surface.start</span>
                        <span className={s.tDim}>→</span>
                        <span className={s.tWhite}>onboarding / first visible win</span>
                      </div>
                      <div className={s.terminalLine}>
                        <span className={s.tMuted}>surface.lesson</span>
                        <span className={s.tDim}>→</span>
                        <span className={s.tWhite}>proof captured / command survives</span>
                      </div>
                      <div className={s.terminalLine}>
                        <span className={s.tMuted}>surface.tutor</span>
                        <span className={s.tDim}>→</span>
                        <span className={s.tWhite}>one grounded next step</span>
                      </div>
                      <div className={s.terminalLine}>
                        <span className={s.tMuted}>surface.autopilot</span>
                        <span className={s.tDim}>→</span>
                        <span className={s.tWhite}>runs, budget, approvals, live truth</span>
                      </div>
                      <div className={s.terminalStatusBar}>
                        <span><span className={s.tGreen}>FOUNDING</span> access</span>
                        <span><span className={s.tWhite}>PREMIUM</span> operator flow</span>
                        <span><span className={s.tYellow}>GREEN</span> studio system</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </SiteReveal>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAtlas}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>Operator atlas</span>
              <h2 className={s.sectionTitle}>Every route in one authored system.</h2>
              <p className={s.sectionBody}>
                Pico is strongest when each surface has one job, one mood, and one next move. Start in the right room.
              </p>
            </div>

            <div className={s.atlasGrid}>
              {ATLAS_ROUTES.map((route, index) => (
                <SiteReveal key={route.href} delay={0.04 * index}>
                  <button
                    className={s.atlasCard}
                    onClick={() => openForm(route.title)}
                    type="button"
                  >
                    <div className={s.atlasMeta}>
                      <span className={s.atlasChapter}>{route.chapter}</span>
                      <span className={s.atlasNote}>{route.note}</span>
                    </div>
                    <h3 className={s.atlasTitle}>{route.title}</h3>
                    <p className={s.atlasBody}>{route.body}</p>
                    <span className={s.atlasLink}>
                      Open route
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('problem.eyebrow')}</span>
              <h2 className={s.sectionTitle}>
                {t('problem.title')}<br />
                {t('problem.titleLine2')}
              </h2>
              <p className={s.sectionBody}>{t('problem.body')}</p>
            </div>

            <div className={s.problemScenarios}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={s.problemCard}>
                  <div className={s.problemLabel}>{t(`problem.scenarios.${i}.label`)}</div>
                  <p className={s.problemBody}>{t(`problem.scenarios.${i}.body`)}</p>
                </div>
              ))}
            </div>

            <p className={s.problemClose}>{t('problem.close')}</p>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('platform.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('platform.title')}</h2>
              <p className={s.sectionBody}>{t('platform.body')}</p>
            </div>
            <div className={s.howGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.06}>
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.howCard}
                  >
                    <span className={s.howIconWrap}>
                      <HowItWorksIcon kind={HOW_ICONS[i]} />
                    </span>
                    <h3 className={s.howTitle}>{t(`platform.howItWorks.${i}.title`)}</h3>
                    <p className={s.howBody}>{t(`platform.howItWorks.${i}.body`)}</p>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('who.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('who.title')}</h2>
            </div>

            <div className={s.whoSplit}>
              <div className={s.whoCol}>
                <h3 className={s.whoColTitle}>{t('who.forYouTitle')}</h3>
                <ul className={s.whoList}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className={s.whoItem}>
                      <Check className={s.whoCheck} />
                      <span>{t(`who.forYou.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={s.whoDivider} aria-hidden="true" />

              <div className={s.whoCol}>
                <h3 className={s.whoColTitle}>{t('who.notForYouTitle')}</h3>
                <ul className={s.notList}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className={s.notItem}>
                      <span className={s.notDash} aria-hidden="true">—</span>
                      <span>{t(`who.notForYou.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('beforeAfter.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('beforeAfter.title')}</h2>
            </div>
            <div className={s.baGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.05}>
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.baCard}
                  >
                    <div className={`${s.baSide} ${s.baBefore}`}>
                      <p className={`${s.baLabel} ${s.baLabelBefore}`}>{t('beforeAfter.beforeLabel')}</p>
                      <p className={s.baText}>{t(`beforeAfter.items.${i}.before`)}</p>
                    </div>
                    <div className={s.baSide}>
                      <p className={`${s.baLabel} ${s.baLabelAfter}`}>{t('beforeAfter.afterLabel')}</p>
                      <p className={`${s.baText} ${s.baTextAfter}`}>{t(`beforeAfter.items.${i}.after`)}</p>
                    </div>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p className={s.baClose}>{t('beforeAfter.close')}</p>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('earlyAccess.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('earlyAccess.title')}</h2>
              <p className={s.sectionBody}>{t('earlyAccess.body')}</p>
            </div>
            <div className={s.benefitsGrid}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={s.benefitItem}>
                  <Check className={s.benefitCheck} />
                  <span>{t(`earlyAccess.benefits.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('faq.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
            </div>
            <div className={s.faqGrid}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={s.faqCard}>
                  <h3 className={s.faqQ}>{t(`faq.items.${i}.q`)}</h3>
                  <p className={s.faqA}>{t(`faq.items.${i}.a`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pre-register" className={`${s.section} ${s.sectionCta}`}>
          <div className={s.shell}>
            <div className={s.ctaPanel}>
              <div className={s.ctaPanelGlow} aria-hidden="true" />
              <div className={s.ctaStack}>
                <SiteReveal delay={0.05}>
                  <span className={s.ctaEyebrow}>
                    <span className={s.ctaEyebrowDot} />
                    {t('finalCta.eyebrow')}
                  </span>
                  <h2 className={s.ctaTitle}>{t('finalCta.title')}</h2>
                </SiteReveal>

                <SiteReveal delay={0.12}>
                  <p className={s.ctaBody}>{t('finalCta.body')}</p>
                </SiteReveal>

                <SiteReveal delay={0.19}>
                  <div className={s.ctaFormWrap}>
                    <p className={s.formHeadline}>{t('finalCta.formHeadline')}</p>
                    <p className={s.formSubline}>{t('finalCta.formSubline')}</p>
                    <button
                      onClick={() => openForm()}
                      className={s.btnPrimary}
                      type="button"
                    >
                      {t('finalCta.ctaButton')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className={s.formCtaMeta}>{t('finalCta.formCtaMeta')}</p>
                  </div>
                </SiteReveal>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
