import {
  PICO_BADGE_RULES,
  PICO_CAPABILITY_UNLOCKS,
  PICO_LESSONS,
  PICO_LEVELS,
  PICO_PLAN_MATRIX,
  PICO_RELEASE_NOTES,
  PICO_SHOWCASE_PATTERNS,
  PICO_TRACKS,
} from '@/lib/pico/academy'
import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'

function buildPicoStructuredContentMessages() {
  return {
    levels: Object.fromEntries(
      PICO_LEVELS.map((level) => [
        String(level.id),
        {
          title: level.title,
          objective: level.objective,
          projectOutcome: level.projectOutcome,
          completionState: level.completionState,
          badge: level.badge,
          recommendedNextStep: level.recommendedNextStep,
        },
      ]),
    ),
    tracks: Object.fromEntries(
      PICO_TRACKS.map((track) => [
        track.slug,
        {
          title: track.title,
          outcome: track.outcome,
          intro: track.intro,
          checklist: track.checklist,
        },
      ]),
    ),
    lessons: Object.fromEntries(
      PICO_LESSONS.map((lesson) => [
        lesson.slug,
        {
          title: lesson.title,
          summary: lesson.summary,
          objective: lesson.objective,
          outcome: lesson.outcome,
          expectedResult: lesson.expectedResult,
          validation: lesson.validation,
          steps: lesson.steps,
          troubleshooting: lesson.troubleshooting,
        },
      ]),
    ),
    releaseNotes: PICO_RELEASE_NOTES.map((note) => ({
      title: note.title,
      body: note.body,
    })),
    showcasePatterns: PICO_SHOWCASE_PATTERNS.map((pattern) => ({
      title: pattern.title,
      summary: pattern.summary,
    })),
    badgeLabels: Object.fromEntries(
      PICO_BADGE_RULES.map((badge) => [badge.id, badge.label]),
    ),
    capabilities: Object.fromEntries(
      PICO_CAPABILITY_UNLOCKS.map((capability) => [
        capability.id,
        {
          title: capability.title,
          description: capability.description,
          actionLabel: capability.actionLabel,
        },
      ]),
    ),
    planMatrix: Object.fromEntries(
      Object.entries(PICO_PLAN_MATRIX).map(([plan, features]) => [plan, features]),
    ),
  }
}

function indexValues<T>(values: readonly T[]) {
  return Object.fromEntries(values.map((value, index) => [String(index), value]))
}

export function getPicoDefaultMessages() {
  const landing = PICO_GENERATED_CONTENT.landing
  const pricing = PICO_GENERATED_CONTENT.pricing
  const wip = PICO_GENERATED_CONTENT.wip

  return {
    pico: {
      meta: landing.meta,
      nav: landing.nav,
      hero: landing.hero,
      trustBar: {
        items: indexValues(landing.trustItems),
      },
      problem: {
        ...landing.problem,
        scenarios: indexValues(landing.problem.scenarios),
      },
      platform: {
        ...landing.platform,
        howItWorks: indexValues(landing.platform.howItWorks),
      },
      who: {
        ...landing.who,
        forYou: indexValues(landing.who.forYou),
        notForYou: indexValues(landing.who.notForYou),
      },
      beforeAfter: {
        ...landing.beforeAfter,
        items: indexValues(landing.beforeAfter.items),
      },
      earlyAccess: {
        ...landing.earlyAccess,
        benefits: indexValues(landing.earlyAccess.benefits),
      },
      faq: {
        ...landing.faq,
        items: indexValues(landing.faq.items),
      },
      finalCta: landing.finalCta,
      localeSwitcher: {
        currentLanguage: 'Current language',
        listLabel: 'Choose interface language',
      },
      footer: {
        brand: 'PicoMUTX',
        logoAlt: 'PicoMUTX logo',
        tagline: 'PicoMUTX is a learning and operations platform for AI agent builders.',
        links: {
          releases: 'Releases',
          docs: 'Docs',
          github: 'GitHub',
          download: 'Download',
          privacy: 'Privacy',
        },
        supportPrompt: 'Need more?',
        supportCta: 'Contact us',
        supportBody: 'for Enterprise pricing (100K+ credits, SSO, SLA).',
      },
      pages: {
        onboarding: {
          meta: {
            title: 'Get Started — PicoMUTX',
            description: 'Set up your PicoMUTX workspace and start learning.',
          },
        },
        pricing: {
          meta: {
            title: 'Pricing — PicoMUTX',
            description: pricing.pageSubtitle,
          },
        },
        academy: {
          meta: {
            title: 'Academy — PicoMUTX',
            description: 'Explore lessons, tracks, and learning paths on PicoMUTX Academy.',
          },
        },
        lesson: {
          meta: {
            title: '{title} — PicoMUTX Academy',
            description: '{summary}',
          },
        },
        autopilot: {
          meta: {
            title: 'Autopilot — PicoMUTX',
            description: 'Automate your workflow with PicoMUTX Autopilot.',
          },
        },
        tutor: {
          meta: {
            title: 'Tutor — PicoMUTX',
            description: 'Get guided help from the PicoMUTX AI tutor.',
          },
        },
        support: {
          meta: {
            title: 'Support — PicoMUTX',
            description: 'Get help and support for PicoMUTX.',
          },
        },
        wip: {
          meta: {
            title: wip.meta.title,
            description: wip.meta.description,
          },
          title: wip.title,
          subtitle: wip.subtitle,
          backToPico: 'Back to Pico',
          mutxPlatform: 'MUTX Platform',
          imageAlt: 'PicoMUTX robot inspecting live stack briefings',
        },
      },
      pricing: {
        eyebrow: 'Plans',
        title: 'Choose self-serve setup or guided help',
        tiers: {
          free: {
            name: 'Free',
            price: '$0',
            period: 'forever',
            description: pricing.planDescriptions.free,
            features: [
              '100 monthly credits',
              'Limited tutor access',
              'Academy lessons (basic)',
              'Community support',
            ],
            cta: 'Current Plan',
            ctaHref: null,
          },
          starter: {
            description: pricing.planDescriptions.starter,
            features: [
              '1,000 monthly credits',
              'Full tutor access',
              'All academy lessons',
              'Autopilot mode',
              'Priority support',
            ],
          },
          pro: {
            description: pricing.planDescriptions.pro,
            features: [
              '10,000 monthly credits',
              'Full tutor + BYOK',
              'API access',
              'Priority support',
              'Custom workflows',
              'Early feature access',
            ],
          },
          enterprise: {
            description: pricing.planDescriptions.enterprise,
          },
        },
      },
      pricingPage: {
        eyebrow: 'Pricing',
        title: 'Start free. Get help when setup needs it.',
        subtitle:
          'PicoMUTX helps you install, prepare an agent packet, and get human help for keys, hosting, integrations, or custom implementation.',
        primaryCta: 'Request priority access',
        secondaryCta: 'Talk to support',
        returnToLanding: 'Return to landing',
        routeState: {
          label: 'Access state',
          title: 'Start with setup. Choose a plan when you need support.',
          body: 'Most users start with onboarding and then decide whether they need 1-on-1 guidance, managed setup, or a custom rollout.',
          signalLabel: 'Access status',
          sessionAttached: 'Hosted session attached',
          sessionLoading: 'Checking hosted session',
          sessionMissing: 'No hosted session yet',
          planLabel: 'Current hosted plan',
          planFallback: 'none yet',
          docsLabel: 'Builder-pack footing',
          stacksLabel: 'Tracked stacks',
        },
        accessPlans: {
          label: 'Plans',
          title: 'Use Pico yourself or get guided setup',
          body: 'Free is enough to inspect the setup flow. Paid plans add more product access and support when setup gets practical.',
          recommended: 'Recommended',
          meta: 'Start with onboarding. Upgrade when API keys, hosting, integrations, or support time matter.',
          noteLabel: 'What you get',
          note: 'Pico is designed to move from install to agent packet to a running agent, with human help available when self-serve setup is too much.',
          truths: [
            'Onboarding prepares the agent packet',
            'Support helps with keys, hosting, and rollout',
            'Custom work is available when self-serve setup is not enough'
          ],
          tiers: {
            trial: {
              name: 'Free trial',
              price: 'Free',
              period: 'trial',
              description: 'Inspect the setup flow and see how the agent packet works.',
              features: [
                'Onboarding and academy access',
                'Agent packet preview',
                'Tutor evaluation',
                'Best fit for first setup',
              ],
              cta: 'Request free trial',
              recommended: true,
            },
            starter: {
              name: 'Starter',
              price: '€29',
              period: '/mo',
              description: 'For a first serious build with more product access and support.',
              features: [
                '€290 annual option',
                'Core setup path access',
                'Agent packet workflow',
                'Human reply when setup gets unclear',
                'Best fit for first-time builders',
              ],
              cta: 'Join the waitlist',
            },
            pro: {
              name: 'Pro',
              price: '€79',
              period: '/mo',
              description: 'For teams that want closer guidance through setup and rollout.',
              features: [
                '€790 annual option',
                'Earlier onboarding window',
                'Higher-touch setup support',
                'Priority help while building',
                'Faster help with hosting and integrations',
                'Best fit for live workflow owners',
              ],
              cta: 'Request priority access',
            },
            enterprise: {
              name: 'Pico Pilot',
              price: 'Custom',
              period: 'rollout',
              description: 'For teams that need custom implementation, hosting guidance, or private rollout.',
              features: [
                'Private rollout planning',
                'Security, approval, and workflow review',
                'Team onboarding design',
                'Custom operating requirements',
                'Direct access to the founders',
              ],
              cta: 'Talk to support',
            },
          },
        },
        livePlans: {
          label: 'Live product plans',
          title: 'Live product plans after setup starts',
          body: 'Use these once you know whether you are self-serving, bringing a team, or asking Pico to help implement the setup.',
          badge: 'Inside Pico',
          badgePopular: 'Recommended',
          currentPlan: 'Current',
          loading: 'Starting checkout...',
          checkoutError: 'Checkout failed. Please try again.',
          truths: [
            'Checkout is for the live app',
            'Hosted session unlocks progress sync and runtime state',
            'Custom work starts with planning',
          ],
          tiers: {
            free: {
              name: 'Free',
              price: '$0',
              period: '/mo',
              description: 'Inspect onboarding, academy, and product shape before you spend.',
              features: [
                'Open onboarding and academy',
                'See tutor and Autopilot product shape',
                'Use hosted progress when signed in',
                'Best fit for evaluation before checkout',
              ],
              cta: 'Open onboarding',
            },
            starter: {
              name: 'Starter',
              price: '$9',
              period: '/mo',
              description: 'One serious setup path with full academy access and tutor support.',
              features: [
                '1,000 monthly credits',
                'Full academy access',
                'Tutor support',
                'Autopilot mode',
                'Best first paid step',
              ],
              cta: 'Choose starter',
            },
            pro: {
              name: 'Pro',
              price: '$29',
              period: '/mo',
              description: 'More runtime visibility, BYOK, and faster support for active workflows.',
              features: [
                '10,000 monthly credits',
                'Full tutor + BYOK',
                'API access',
                'Priority support',
                'Best for active workflow owners',
              ],
              cta: 'Choose pro',
            },
            enterprise: {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: 'Team rollout planning with identity, controls, and direct implementation support.',
              features: [
                'SSO and team management',
                'Dedicated rollout planning',
                'SLA-aligned support',
                'Custom workflow design',
                'Direct access to founders',
              ],
              cta: 'Book planning call',
            },
          },
        },
        stackLabel: 'Stack notes',
        stackTitle: 'What Pico uses during setup',
        stackBody: 'Pico uses tracked pack docs, sequenced lessons, and live stack briefings so the setup path and agent packet stay practical.',
        stackFooterPrefix: 'Last builder-pack refresh',
        stackFooterMiddle: 'across',
        stackFooterDocs: 'visible docs and',
        stackFooterStacks: 'tracked stack briefings.',
        finalLabel: 'Next move',
        finalTitle: 'Need help choosing the right setup?',
        finalBody: 'Start free if you want to inspect Pico. Talk to support if you need help with API keys, hosting, integrations, or a custom implementation.',
        finalPrimary: 'Talk to support',
        finalSecondary: 'Return to landing',
      },
      auth: {
        eyebrow: 'Pico host auth',
        orUseEmail: 'Or use email',
        forgotPassword: 'Forgot password?',
        fields: {
          name: {
            label: 'Name',
            placeholder: 'Jane Smith',
          },
          email: {
            label: 'Email',
            placeholder: 'you@company.com',
          },
          password: {
            label: 'Password',
            placeholder: 'Enter your password',
          },
          confirmPassword: {
            label: 'Confirm password',
            placeholder: 'Confirm your password',
          },
        },
        modes: {
          login: {
            title: 'Enter the current Pico build',
            subtitle: 'Use a provider or email to open the preview and save your place.',
            submit: 'Enter Pico',
            loading: 'Opening...',
            toggleQuestion: 'Need access?',
            toggleAction: 'Create one',
          },
          register: {
            title: 'Create your Pico preview account',
            subtitle: 'Sign up once, save your place, and keep following the product as it improves.',
            submit: 'Create preview account',
            loading: 'Creating...',
            toggleQuestion: 'Already have an account?',
            toggleAction: 'Sign in',
          },
        },
        errors: {
          passwordMismatch: 'Passwords do not match',
          passwordTooShort: 'Password must be at least 8 characters',
          loginFailed: 'Failed to sign in',
          registerFailed: 'Failed to create account',
          emailRequired: 'Enter your email address first',
          resendFailed: 'Failed to resend',
        },
        notice: {
          verificationSent: 'Verification email sent',
          resending: 'Sending...',
          resendVerification: 'Resend verification email',
        },
      },
      authRecovery: {
        forgotPassword: {
          eyebrow: 'Password recovery',
          title: 'Recover account access.',
          description:
            'Use the email attached to your MUTX account and we will send a reset link. The dashboard, docs, and install flow remain available while you recover access.',
          asideEyebrow: 'Recovery notes',
          asideTitle: 'Keep recovery practical.',
          asideBody:
            'Reset flows should be simple and easy to verify. If the account does not exist, the form still gives a stable next step.',
          highlights: [
            'Use the work email tied to the hosted account.',
            'Reset links expire, so handle the email quickly once it lands.',
            'Docs and dashboard stay available if you only need product information right now.',
          ],
          successTitle: 'Check your email',
          successBody: 'We have sent password reset instructions to {email}.',
          successHint: 'If the email does not show up, check spam or request another link.',
          backToSignIn: 'Back to sign in',
          tryAgain: 'Try again',
          sendTitle: 'Send reset instructions',
          sendBody: 'No drama. Just the email and a fresh link.',
          emailLabel: 'Email address',
          emailPlaceholder: 'you@company.com',
          sending: 'Sending...',
          sendLink: 'Send reset link',
        },
        resetPassword: {
          eyebrow: 'Reset password',
          title: 'Set a fresh password.',
          description:
            'Use a strong password, confirm it cleanly, and finish the reset without guessing whether the flow worked.',
          asideEyebrow: 'Reset rules',
          asideTitle: 'Keep the recovery path boring.',
          asideBody:
            'Password resets should be plain, fast, and easy to verify.',
          highlights: [
            'Reset links are token-based, so an expired or missing token should fail clearly.',
            'Use a password that clears your own security bar, not just the minimum validator.',
            'If hosted auth is not your current path, docs and dashboard remain visible.',
          ],
          invalidTitle: 'Invalid reset link',
          invalidBody: 'This password reset link is missing, invalid, or already expired.',
          requestNewLink: 'Request a new link',
          backToSignIn: 'Back to sign in',
          completeTitle: 'Password reset complete',
          completeBody: 'Your password has been updated. You can sign in with the new credentials now.',
          signIn: 'Sign in',
          formTitle: 'Choose a new password',
          formBody: 'Keep it strong, confirm it once, and the form will do the rest.',
          newPassword: 'New password',
          confirmPassword: 'Confirm password',
          resetting: 'Resetting...',
          resetPassword: 'Reset password',
          passwordsMismatch: 'Passwords do not match',
          passwordTooShort: 'Password must be at least 8 characters',
        },
        verifyEmail: {
          eyebrow: 'Verify email',
          title: 'Confirm the account email.',
          description:
            'Verification confirms the token, can resend from the active host, and keeps the next route stable.',
          asideEyebrow: 'Verification rules',
          asideTitle: 'Keep confirmation explicit.',
          asideBody:
            'Provider auth can skip this because the upstream identity is already verified. Password registration uses email confirmation.',
          highlights: [
            'Verification links terminate on the active frontend host instead of a hardcoded marketing route.',
            'Expired or invalid tokens fail clearly and leave a resend path.',
            'After confirmation, sign-in can send you directly back to the intended platform route.',
          ],
          verifying: 'Verifying your email...',
          missingContext: 'This verification route needs a token or the email that should receive one.',
          sentTo: 'We sent a verification link to {email}.',
          verificationComplete: 'Verification complete',
          verificationCompleteBody: 'The account can sign in now. Use the same email and continue into the intended route.',
          signIn: 'Sign in',
          checkInbox: 'Check your inbox',
          checkInboxBody: 'Open the verification link from the same device if possible. If it does not arrive, resend it from here.',
          resend: 'Resend verification email',
          resendSending: 'Sending...',
          resendNeedsEmail: 'Enter the address on the sign-up form first so verification can be resent.',
          resendSent: 'We sent another verification link to {email}.',
          verifySuccess: 'Email has been verified successfully.',
          verifyFailure: 'Failed to verify email',
          resendFailure: 'Failed to resend verification email',
          verificationFailed: 'Verification failed',
          verificationFailedBody: 'If the token expired, request another message from the address that owns the account.',
        },
      },
      content: buildPicoStructuredContentMessages(),
    },
  }
}
