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
  const onboarding = PICO_GENERATED_CONTENT.onboarding
  const pricing = PICO_GENERATED_CONTENT.pricing
  const tutor = PICO_GENERATED_CONTENT.tutor
  const support = PICO_GENERATED_CONTENT.support
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
      shell: {
        nav: {
          onboarding: {
            href: '/onboarding',
            label: 'Start',
            chapter: '01',
            note: 'first visible win',
          },
          academy: {
            href: '/academy',
            label: 'Lessons',
            chapter: '02',
            note: 'the working path',
          },
          tutor: {
            href: '/tutor',
            label: 'Tutor',
            chapter: '03',
            note: 'one grounded answer',
          },
          autopilot: {
            href: '/autopilot',
            label: 'Autopilot',
            chapter: '04',
            note: 'live control room',
          },
          support: {
            href: '/support',
            label: 'Human help',
            chapter: '05',
            note: 'the messy edge',
          },
        },
        wordmark: {
          logoAlt: 'PicoMUTX logo',
          brand: 'PicoMUTX',
          title: 'operator atlas',
        },
        labels: {
          chapter: 'Chapter {chapter}',
          currentChapter: 'Current chapter',
          routeMode: 'Route mode',
          chapterNote: 'Chapter note',
          chapterNoteBody:
            'This surface should reduce uncertainty immediately and point to the next irreversible action.',
          previous: 'Previous: {label}',
          next: 'Next: {label}',
          startOfSequence: 'Start of sequence',
          finalChapter: 'Final chapter',
          focusModeActive: 'Focus mode is active.',
          mapStaysOpen: 'The map stays open.',
          backToMap: 'Back to map',
          proof: 'Proof',
          openMission: 'Open mission',
        },
        actions: {
          howThisWorks: 'How this works',
          map: 'Map',
          help: 'Help',
          quickHelp: 'Quick help',
          previousShort: 'Prev',
          nextShort: 'Next',
          previousChapter: 'Previous chapter',
          nextChapter: 'Next chapter',
          previousChapterAria: 'Go to previous chapter: {label}',
          nextChapterAria: 'Go to next chapter: {label}',
          openAcademyMapAria: 'Open academy map',
          openHelpLaneAria: 'Open help lane',
          showRecovery: 'Show recovery',
          hideRecovery: 'Hide recovery',
        },
        helpLane: {
          stayHereWhen: 'Stay here when',
          stayHereBody: 'the next move is still inside {label}.',
          recoveryRoute: 'Recovery route',
          recoveryTitle: 'Open support lane',
          recoveryBody:
            'Use this when the product route is no longer honest about the blocker.',
          continueSequence: 'Continue sequence',
          continueTitleFallback: 'Human help',
          continueBody: 'Keep momentum if the next chapter is already the right tool.',
        },
        robotCard: {
          label: 'Pico signal',
        },
        routeRobots: {
          landing: {
            alt: 'PicoMUTX mascot floating above the product surface',
            title: 'Launch signal',
            caption:
              'Keep the landing read clean: one strong mascot cue, then let the routed product pages carry the rest of the character.',
          },
          onboarding: {
            alt: 'PicoMUTX mascot guiding an operator through the next step',
            title: 'Guide marker',
            caption:
              'Onboarding should feel like the first honest handoff into the product, with one clear next move and no mascot pile-up.',
          },
          academy: {
            alt: 'PicoMUTX mascot growing from a fresh start',
            title: 'Lesson posture',
            caption:
              'Academy is where the system grows operator confidence a step at a time, so the visual cue stays calm and directional.',
          },
          tutor: {
            alt: 'PicoMUTX mascot assembling a workflow',
            title: 'Crit desk',
            caption:
              'Tutor should feel like a focused working session: grounded feedback, one revision path, and no decorative noise.',
          },
          autopilot: {
            alt: 'PicoMUTX mascot pointing at a control signal',
            title: 'Control-room cue',
            caption:
              'Autopilot earns trust when the operator can read state, spend, and risk quickly enough to act without guessing.',
          },
          support: {
            alt: 'PicoMUTX mascot taking a brief pause between runs',
            title: 'Desk tone',
            caption:
              'Support can lower the temperature without losing momentum, which is exactly where a calmer signal belongs.',
          },
        },
      },
      welcomeTour: {
        label: 'Quick help',
        title: 'Learn the codex once, then close it.',
        close: 'Close',
        closeAria: 'Close quick tour',
        back: 'Back',
        next: 'Next',
        finish: 'Finish',
        steps: {
          mission: {
            eyebrow: '01 Mission',
            title: 'Each Pico surface should have one dominant action.',
            body:
              'If a page looks equally about navigation, metrics, and explanation, it is lying. Find the one move that clears the route.',
            bullets: {
              current: 'You are in Chapter {chapter}: {label}.',
              backtrack: 'Backtrack target: {label}.',
              onboarding: 'Backtrack target: onboarding.',
              forward: 'Forward route: {label}.',
              support: 'Forward route: support.',
            },
          },
          default: {
            eyebrow: '02 First win',
            title: 'Onboarding exists to compress the first visible success.',
            body:
              'Use it to get to one working runtime and one proof artifact, then move immediately into the codex.',
            bullets: {
              primary: 'Treat preferences as noise until the first success is real.',
              secondary: 'Academy becomes useful once you need the exact lane.',
              currentSurface: 'Current surface: {pageTitle}.',
            },
          },
          academy: {
            eyebrow: '02 Mission first',
            title: 'The codex only wants one mission to matter.',
            body:
              'Open the dominant lesson, clear the visible step, and let the archive stay quiet until the main route is done.',
            bullets: {
              primary: 'The map explains sequence. It should not compete with the mission.',
              secondary: 'The current proof lane is the only part that should feel urgent.',
              currentSurface: 'Current surface: {pageTitle}.',
            },
          },
          tutor: {
            eyebrow: '02 One blocker',
            title: 'Tutor is for the exact next move.',
            body:
              'Ask about the one command, file path, or validation step that is stopping the route.',
            bullets: {
              primary: 'If the sequence is wrong, return to Academy.',
              secondary: 'If live runtime state is the blocker, open Autopilot.',
              currentSurface: 'Current surface: {pageTitle}.',
            },
          },
          autopilot: {
            eyebrow: '02 Runtime truth',
            title: 'Autopilot beats lesson copy when the system is live.',
            body:
              'Use the runtime surface when the answer depends on runs, alerts, approvals, or current state.',
            bullets: {
              primary: 'Return to Academy when the mission sequence is the real problem.',
              secondary: 'Escalate only after runtime truth is no longer enough.',
              currentSurface: 'Current surface: {pageTitle}.',
            },
          },
          support: {
            eyebrow: '02 Human edge',
            title: 'Support should send you back into motion fast.',
            body:
              'Bring the cleanest lesson or runtime packet possible, then return to the product instead of lingering here.',
            bullets: {
              primary: 'Support is the messy edge, not the default workspace.',
              secondary: 'Carry lesson slug, proof, and blocker when you escalate.',
              currentSurface: 'Current surface: {pageTitle}.',
            },
          },
          proof: {
            eyebrow: '03 Proof',
            title: 'Never leave the route without a proof artifact.',
            body:
              'The platform becomes trustworthy only when each cleared step leaves behind evidence, not just optimism.',
            bullets: {
              primary: 'If the blocker is exact, ask Tutor.',
              secondary: 'If the blocker is live system truth, open Autopilot.',
              tertiary: 'If both fail, escalate to Support with the proof and notes.',
            },
          },
        },
      },
      surfaceCompass: {
        label: 'Surface compass',
        asideLabel: 'Operating rule',
      },
      sessionBanner: {
        labels: {
          hostedSession: 'Hosted session',
          productTruth: 'Product truth',
          withoutSession: 'Without session',
          identity: 'Identity',
          plan: 'Plan',
          emailState: 'Email state',
          webhookRoutes: 'Webhook routes',
          progressSync: 'Progress sync',
          runtimeTruth: 'Runtime truth',
          approvalConfidence: 'Approval confidence',
          approvalsAndWebhooks: 'Approvals + webhooks',
        },
        chips: {
          hostedSessionAttached: 'hosted session attached',
          hostedSessionRequired: 'hosted session required',
          picoHostAuth: 'pico host auth',
          planUnknown: 'plan unknown',
          verificationPending: 'verification pending',
          emailVerified: 'email verified',
          emailStatusUnknown: 'email status unknown',
          loadingWebhooks: 'loading webhooks',
          webhooksUnavailable: 'webhooks unavailable',
          webhookCount: '{count, plural, one {# webhook} other {# webhooks}}',
        },
        states: {
          pending: 'pending',
          verified: 'verified',
          unknown: 'unknown',
          operator: 'operator',
          loading: 'loading',
          notAvailable: 'n/a',
          live: 'live',
          checking: 'checking',
          grounded: 'grounded',
          partial: 'partial',
          limited: 'limited',
          usable: 'usable',
          localOnly: 'local only',
          notTrustworthyYet: 'not trustworthy yet',
          blocked: 'blocked',
          readonlyFeeling: 'read-only feeling',
        },
        authenticated: {
          signedInAs:
            'Signed in as <identityText>{identity}</identityText>. Progress sync, onboarding state, approvals, and live runtime data can now use the hosted MUTX account on this host.',
          verificationBody:
            'Password accounts stay limited until the inbox link is confirmed. Finish that before treating the hosted session as production-ready.',
          productTruthBody:
            'The product can now tell the truth about progress, runtime state, approvals, and hosted setup. If this account is not production-ready yet, fix that here before trusting the rest of the surface.',
          finishEmailVerification: 'Finish email verification',
        },
        loading: {
          body: 'Checking whether this Pico host has an operator session attached.',
        },
        error: {
          fallback: 'Unable to load hosted session state',
        },
        guest: {
          body:
            'The Pico platform routes are live here, but the hosted session is not attached yet on this domain. Sign in on Pico to persist progress, read live runs, and use the backend onboarding/runtime state. Google, GitHub, Discord, Apple, password signup, and email confirmation all terminate on this host now.',
          progressBody:
            'Attach the Pico account on this host before you trust progress, live runtime state, or approval behavior.',
          progressWontPersist: 'won’t persist',
          signIn: 'Sign in',
          createAccount: 'Create account',
        },
      },
      platformSurface: {
        labels: {
          deskLabel: 'Platform desk',
          title: 'Identity, route memory, and limits in one place',
          description:
            'This is the operator-facing control desk for the Pico account. It should tell the truth about plan limits, where the operator was last working, and whether the product chrome is tuned for focus or recovery.',
          plan: 'Plan',
          verification: 'Verification',
          workspaceSaves: 'Workspace saves',
          routeMemory: 'Route memory',
          routeMemoryBody:
            'The current surface should match what the operator is actually doing. Keep this updated when the product shifts lanes.',
          currentSurface: 'Current surface',
          lastLessonContext: 'Last lesson context',
          currentSurfaceBody:
            'Route memory should follow the operator through Pico instead of resetting every time the page changes.',
          lastLessonContextBody:
            'This is the recovery point when the operator needs to re-enter the lesson spine.',
          collapseRail: 'Collapse rail',
          collapseRailBody:
            'Use a tighter chrome when the operator already knows the route and needs more room for the live surface.',
          keepHelpLaneOpen: 'Keep help lane open',
          keepHelpLaneOpenBody:
            'Keep recovery guidance visible when the operator is still learning the product routes.',
          entitlements: 'Entitlements',
          routeLedger: 'Route ledger',
          currentPath: 'Current path',
          platformStateUpdated: 'Platform state updated',
          syncConfidence: 'Sync confidence',
          operatorTruth: 'Operator truth',
          operatorTruthBody:
            'The product should remember the route and lesson context without pretending it knows more than it does. `activeSurface`, `lastOpenedLessonSlug`, the rail state, and the help lane are the minimum persisted memory needed to make Pico feel like one platform.',
        },
        states: {
          notRecorded: 'not recorded',
          pending: 'pending',
          verified: 'verified',
          unknown: 'unknown',
          signIn: 'sign in',
          activeNow: 'active now',
          setRoute: 'set route',
          hydrating: 'hydrating',
          live: 'live',
          saving: 'saving',
          localOnly: 'local only',
        },
        actions: {
          resumeLastLesson: 'Resume last lesson',
          openAcademy: 'Open academy',
          clearLessonMemory: 'Clear lesson memory',
          resetPlatformMemory: 'Reset platform memory',
          openLiveControlRoom: 'Open live control room',
        },
        surfaceOptions: {
          onboarding: {
            label: 'Onboarding',
            note: 'Launch bay memory',
          },
          academy: {
            label: 'Academy',
            note: 'Primary learning spine',
          },
          lesson: {
            label: 'Lesson',
            note: 'Active step memory',
          },
          tutor: {
            label: 'Tutor',
            note: 'Grounded next-step help',
          },
          autopilot: {
            label: 'Autopilot',
            note: 'Runtime control room',
          },
          support: {
            label: 'Support',
            note: 'Human escalation lane',
          },
        },
        entitlementLabels: {
          academy: 'academy',
          tutor: 'tutor',
          project_limit: 'project limit',
          monitored_agents: 'monitored agents',
          alerts: 'alerts',
          approvals: 'approvals',
          retention: 'retention',
        },
      },
      generated: {
        onboarding,
        tutor,
        support,
      },
      supportPage: {
        shell: {
          eyebrow: 'Human help',
          title: 'Get a human when the product path stops being enough',
          description:
            'This route should triage the messy edge fast. Keep the escalation clean, attach the runtime truth, and send the operator back into motion.',
          getHumanHelp: 'Get human help',
          requestOfficeHours: 'Request office hours',
        },
        contactForm: {
          title: 'Tell us where the product path broke',
          subtitle:
            'Share the route, blocker, and proof. We will answer like humans, not a waitlist.',
          interestLabel: 'What broke?',
          interestOptions: {
            fixingExisting: 'Lesson or command blocker',
            runtimeTruth: 'Live runtime or Autopilot mismatch',
            hostedSession: 'Hosted session or account mismatch',
            billingOrPlan: 'Billing, approvals, or plan question',
            other: 'Office hours or deeper walkthrough',
          },
          messageLabel: 'What happened?',
          messageOptional: '(include the packet)',
          messagePlaceholder: 'Paste the exact blocker, route, command, or runtime mismatch.',
          submit: 'Send support request',
          submitting: 'Sending support request...',
          disclaimer: 'No waitlist. No launch theater. Just a human reply.',
          successTitle: 'Support request sent.',
          successBody:
            'We got the packet. Expect a human reply that points you back into the product.',
          successBack: 'Back to support',
        },
        compass: {
          title: 'Support only exists to return the operator to the product',
          body:
            'Escalate cleanly, attach the packet, then go back to the surface that can move the work again. Academy is for sequence problems, tutor is for one knowable next step, and Autopilot is for live runtime truth.',
          openStatus: 'escalation open',
          standbyStatus: 'human help standby',
          aside:
            'Human help should resolve the messy edge, not replace the product. The best support interaction ends with a clearer route back into Pico.',
          items: {
            academyResume: 'Resume {title}',
            academyFallback: 'Return to academy',
            academyCaption:
              'Go back here when the blocker was still fundamentally a lesson sequence problem.',
            academyNote: 'Sequence',
            tutorLabel: 'Ask tutor first',
            tutorCaption:
              'Use this when the product probably still knows the answer but you need the exact next move.',
            tutorNote: 'Knowable',
            autopilotLabel: 'Re-enter Autopilot',
            autopilotCaption:
              'Open the control room when the blocker depends on live runs, budget, alerts, or approvals.',
            autopilotNote: 'Runtime',
          },
        },
        escalationStandards: {
          label: 'Escalation standards',
          title: 'Hand off the problem like a sharp operator',
          chip: 'route • evidence • return',
          packetPostureLabel: 'Packet posture',
          packetPostureBody:
            'Premium support starts with a clean packet. The best escalation reads like an operator handoff, not a panic dump.',
          deskToneLabel: 'Desk tone',
          deskToneBody:
            'Support should lower the temperature without slowing the route back into action.',
          bestFirstMoveLabel: 'Best first move',
          bestFirstMoveBody:
            'Copy the packet, choose the right lane, and ask for the shortest route back into Academy, Tutor, or Autopilot.',
          robotAlt: 'PicoMUTX mascot taking a brief pause between runs',
        },
        desk: {
          label: 'Support desk',
          title: 'Send context, not noise',
          body:
            'Human help is for the part the product cannot truthfully close on its own. The faster you frame the blocker, the faster support can send you back to the product path.',
          warningTitle: 'If the next move is still obvious, go back and do it.',
          warningBody:
            'Support exists for the messy edge, not for skipping the lesson, the tutor, or the live control surface.',
          primaryLaneCta: 'Start escalation',
          secondaryLaneCta: 'Book office hours',
          operatorRailLabel: 'Operator rail',
          supportRequests: 'Support requests',
          tutorQuestions: 'Tutor questions',
          plan: 'Plan',
          activeSurface: 'Active surface',
          planUnknown: 'unknown',
          signIn: 'sign in',
          activeSurfaceNone: 'none',
          tryTheseFirst: 'Try these first',
          tryTutorFirst: 'Try tutor first',
          openLesson: 'Open {title}',
          returnToAcademy: 'Return to academy',
          openAutopilot: 'Open Autopilot',
          directLine: 'Direct line',
        },
        packet: {
          label: 'Diagnostic packet',
          title: 'Operator packet',
          chip: 'live context',
          copyPacket: 'Copy packet',
          copiedPacket: 'Copied packet',
          openFormWithPacket: 'Open form with packet',
          liveOperatorState: 'Live operator state',
          header: 'Pico diagnostic packet',
          route: 'Route',
          hostedSession: 'Hosted session',
          hostedPlan: 'Hosted plan',
          selectedTrack: 'Selected track',
          completedLessons: 'Completed lessons',
          hostedOnboarding: 'Hosted onboarding',
          runtimeStatus: 'Runtime status',
          currentTrack: 'Current track',
          nextLesson: 'Next lesson',
          lessonWorkspace: 'Lesson workspace',
          focusedStep: 'Focused step',
          recoveryLesson: 'Recovery lesson',
          recoveryLessonWorkspace: 'Recovery lesson workspace',
          recoveryLessonFocusedStep: 'Recovery lesson focused step',
          recoveryLessonProof: 'Recovery lesson proof',
          activeSurface: 'Active surface',
          lastOpenedLesson: 'Last opened lesson',
          railCollapsed: 'Rail collapsed',
          helpLaneOpen: 'Help lane open',
          supportRequestsSent: 'Support requests sent',
          tutorQuestionsAsked: 'Tutor questions asked',
          approvalGateEnabled: 'Approval gate enabled',
          hostedOnboardingStatus: 'Hosted onboarding status',
          hostedOnboardingStep: 'Hosted onboarding step',
          hostedWorkspace: 'Hosted workspace',
          gatewayUrl: 'Gateway URL',
          runtimeBindings: 'Runtime bindings',
          notAttached: 'not attached',
          notChosenYet: 'not chosen yet',
          notAvailable: 'not available',
          none: 'none',
          yes: 'yes',
          no: 'no',
          captured: 'captured',
          missing: 'missing',
        },
        returnMap: {
          label: 'Return map',
          title: 'Human help should end in one cleaner route back into Pico',
          chip: 'operator return map',
          supportReturnModel: 'Support return model',
          steps: {
            route: {
              title: '1. Route the blocker fast',
              body: 'Do not send a life story. Lead with the exact surface that broke.',
            },
            evidence: {
              title: '2. Attach the evidence',
              body: 'Send the command, runtime fact, or approval state that proves what failed.',
            },
            return: {
              title: '3. Return to the product',
              body: 'The response should restore momentum, not create a support maze.',
            },
          },
          packetAnatomy: {
            label: 'Packet anatomy',
            body:
              'A premium escalation packet always reads in the same order: route, evidence, return lane.',
            routeLabel: 'Route first',
            routeBody: 'Name the exact surface that broke.',
            evidenceLabel: 'Evidence second',
            evidenceBody: 'Attach the signal that proves the failure.',
            returnLabel: 'Return third',
            returnBody: 'Ask for the cleanest way back into motion.',
          },
          lessonPath: {
            label: 'Lesson path',
            title: 'Resume the academy lane',
            body:
              'Use this when the blocker was still fundamentally a lesson or setup sequence problem.',
            openLesson: 'Open {title}',
            returnToAcademy: 'Return to academy',
          },
          groundedAnswer: {
            label: 'Grounded answer',
            title: 'Ask tutor if the next move is still knowable',
            body:
              'Go back here when the product likely still knows the answer but you need the exact next step.',
            action: 'Open tutor',
          },
          runtimeTruth: {
            label: 'Runtime truth',
            title: 'Re-enter the control room',
            body:
              'Use Autopilot when the blocker depends on live runs, budget, approvals, or alert state.',
            action: 'Open Autopilot',
          },
        },
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
        title: pricing.pageTitle,
        subtitle: pricing.pageSubtitle,
        badgePopular: 'Most Popular',
        loading: 'Starting checkout...',
        checkoutError: 'Checkout failed. Please try again.',
        footer: pricing.pageFooter,
        enterpriseSupport: 'Need more?',
        enterpriseSupportCta: 'Contact us',
        enterpriseSupportBody: 'for Enterprise pricing (100K+ credits, SSO, SLA).',
      },
      auth: {
        eyebrow: 'Pico host auth',
        orUseEmail: 'Or use email',
        oauthContinue: 'Continue with {provider}',
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
