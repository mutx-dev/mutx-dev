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
        eyebrow: 'Live surface depth',
        title: 'Choose the operator lane that fits the work',
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
        eyebrow: 'Pricing route',
        title: 'See the access lane first. See the billing layer second.',
        subtitle:
          'PicoMUTX is still in founding-access mode. This page keeps that honest, then shows the live in-product plans for teams already inside the system or preparing rollout.',
        primaryCta: 'Request priority access',
        secondaryCta: 'Talk to support',
        returnToLanding: 'Return to landing',
        routeState: {
          label: 'Route state',
          title: 'Founding access is the front door. Live billing is deeper in the product.',
          body: 'Start with the lane that matches your urgency. Use the live plans only when you already need an authenticated workspace, checkout, or rollout planning.',
          signalLabel: 'Access signal',
          sessionAttached: 'Hosted session attached',
          sessionLoading: 'Checking hosted session',
          sessionMissing: 'No hosted session yet',
          planLabel: 'Current hosted plan',
          planFallback: 'none yet',
          docsLabel: 'Builder-pack footing',
          stacksLabel: 'Tracked stacks',
        },
        accessPlans: {
          label: 'Live product lanes',
          title: 'Choose the Pico lane that matches the next real move',
          body: 'These cards should point at live Pico routes, not a placeholder intake funnel. Use onboarding for the fastest start and pricing when you need plan detail.',
          recommended: 'Most direct',
          meta: 'The landing and pricing route should both keep the next move honest: start the product path first, then choose the plan depth you need.',
          noteLabel: 'Why this section exists',
          note: 'The landing and pricing route should say the same thing: open the real Pico flow, then choose the lane that fits the work.',
          truths: [
            'Onboarding is the first real step',
            'Pricing is live when plan detail matters',
            'Support stays inside the same Pico product path'
          ],
          tiers: {
            starter: {
              name: 'Starter lane',
              price: 'Free',
              period: 'waitlist',
              description: 'For founders making the first serious build.',
              features: [
                'Free early-access request',
                'Core build path access',
                'Launch lessons and templates',
                'Human reply when the path gets unclear',
                'Best fit for first-time operators',
              ],
              cta: 'Join the waitlist',
            },
            pro: {
              name: 'Priority lane',
              price: 'Priority',
              period: 'onboarding',
              description: 'For operators who want the fastest path with tighter support.',
              features: [
                'Earlier onboarding window',
                'Higher-touch product feedback loop',
                'Priority support while building',
                'Faster escalation when context gets messy',
                'Best fit for live workflow owners',
              ],
              cta: 'Request priority access',
            },
            enterprise: {
              name: 'Enterprise',
              price: 'Custom',
              period: 'rollout',
              description: 'For teams planning private rollout, security review, or multi-seat adoption.',
              features: [
                'Private rollout planning',
                'Security, approval, and workflow review',
                'Team onboarding design',
                'Custom operating requirements',
                'Direct access to the founders',
              ],
              cta: 'Open support lane',
            },
          },
        },
        livePlans: {
          label: 'Live product plans',
          title: 'Live product plans once Pico is already in play',
          body: 'If you already have access, or you need to understand the billing layer behind the product, these are the plans that activate deeper inside Pico.',
          badge: 'Inside Pico',
          badgePopular: 'Operator default',
          currentPlan: 'Current',
          loading: 'Starting checkout...',
          checkoutError: 'Checkout failed. Please try again.',
          truths: [
            'Checkout is for the live app, not the waitlist',
            'Hosted session unlocks progress sync and runtime state',
            'Enterprise starts with rollout planning, not a blind card swipe',
          ],
          tiers: {
            free: {
              name: 'Free',
              price: '$0',
              period: '/mo',
              description: 'Inspect onboarding, academy, and live product shape before you spend.',
              features: [
                'Open onboarding and academy surfaces',
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
              description: 'One serious build lane with full academy access and grounded tutoring.',
              features: [
                '1,000 monthly credits',
                'Full academy access',
                'Grounded tutor support',
                'Autopilot mode',
                'Best first paid step',
              ],
              cta: 'Choose starter',
            },
            pro: {
              name: 'Pro',
              price: '$29',
              period: '/mo',
              description: 'Multiple live lanes with stronger runtime visibility and faster operator escalation.',
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
              description: 'Team rollout planning with identity, controls, and direct operator support.',
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
        stackLabel: 'Stack truth',
        stackTitle: 'What backs the access promise',
        stackBody: 'The offer is grounded in tracked pack docs, sequenced lessons, and live stack briefings. This route should show what is actually behind the product, not just the logo on top.',
        stackFooterPrefix: 'Last builder-pack refresh',
        stackFooterMiddle: 'across',
        stackFooterDocs: 'visible docs and',
        stackFooterStacks: 'tracked stack briefings.',
        finalLabel: 'Next move',
        finalTitle: 'Need help choosing the honest lane?',
        finalBody: 'If the question is urgency, plan fit, or rollout shape, support should answer it directly and send you back into the right Pico route.',
        finalPrimary: 'Open support lane',
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
          title: 'Recover operator access without leaving the control plane.',
          description:
            'Use the email attached to your MUTX account and we will send a reset link. If hosted auth is not the lane you need today, the dashboard, docs, and install flow are still available.',
          asideEyebrow: 'Recovery notes',
          asideTitle: 'Keep the auth lane practical.',
          asideBody:
            'Reset flows should be simple, honest, and easy to verify. If the account does not exist or the hosted lane is unavailable, the rest of the public surface still tells the truth.',
          highlights: [
            'Use the work email tied to the hosted operator account.',
            'Reset links expire, so handle the email quickly once it lands.',
            'Docs and dashboard stay available if you only need product truth right now.',
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
          title: 'Set a fresh password and get back to the operator lane.',
          description:
            'Use a strong password, confirm it cleanly, and finish the reset without guessing whether the flow worked.',
          asideEyebrow: 'Reset rules',
          asideTitle: 'Keep the recovery path boring.',
          asideBody:
            'Password resets should be plain, fast, and easy to verify. Strong form states matter more than ornamental auth theater.',
          highlights: [
            'Reset links are token-based, so an expired or missing token should fail honestly.',
            'Use a password that clears your own security bar, not just the minimum validator.',
            'If hosted auth is not your current path, docs and dashboard remain visible while the lane hardens.',
          ],
          invalidTitle: 'Invalid reset link',
          invalidBody: 'This password reset link is missing, invalid, or already expired.',
          requestNewLink: 'Request a new link',
          backToSignIn: 'Back to sign in',
          completeTitle: 'Password reset complete',
          completeBody: 'Your password has been updated. The sign-in lane can use the new credentials now.',
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
          title: 'Confirm the address before the platform pretends you are ready.',
          description:
            'Verification is part of the account boundary now. The flow confirms the token honestly, can resend from the active host, and keeps the next route stable instead of bouncing you into a fake success state.',
          asideEyebrow: 'Verification rules',
          asideTitle: 'Keep confirmation explicit.',
          asideBody:
            'Provider auth can skip this because the upstream identity is already verified. Password registration stays accountable through the email confirmation lane.',
          highlights: [
            'Verification links terminate on the active frontend host instead of a hardcoded marketing route.',
            'Expired or invalid tokens fail honestly and leave a clear resend path.',
            'After confirmation, the sign-in lane can send you directly back to the intended platform route.',
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
