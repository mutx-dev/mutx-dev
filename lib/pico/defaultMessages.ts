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

function buildPicoSupportPageMessages() {
  const support = PICO_GENERATED_CONTENT.support

  return {
    contact: {
      interest: {
        lessonBlocker: 'Lesson or command blocker',
        runtimeMismatch: 'Live runtime or Autopilot mismatch',
        sessionMismatch: 'Hosted session or account mismatch',
        billingPlan: 'Billing, approvals, or plan question',
        officeHours: 'Office hours or deeper walkthrough',
      },
      title: 'Tell us where the product path broke',
      subtitle: 'Share the route, blocker, and proof. We will answer like humans, not a waitlist.',
      interestLabel: 'What broke?',
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
    shell: {
      eyebrow: 'Human help',
      title: 'Get a human when the product path stops being enough',
      description:
        'Triage the messy edge fast, attach the real signal, and get back to the next honest move without turning support into a maze.',
    },
    hero: {
      badge: 'Escalation pulse',
      mode: {
        open: 'desk open',
        triage: 'triage mode',
      },
      title: 'Send the blocker with enough proof to fix it fast.',
      body:
        'Name the route, attach the signal, and point to the return lane. That gives support enough context to answer without slowing the next move down.',
      packetState: {
        label: 'Packet state',
        readyToPaste: 'ready to paste',
        routeAndEvidenceFirst: 'route and evidence first',
      },
      runtimeTruth: {
        label: 'Runtime truth',
        gatewayAttached: 'gateway attached',
        attachSignal: 'attach the signal if it matters',
      },
      returnLane: {
        label: 'Return lane',
      },
      handoff: {
        label: 'Shortest clean handoff',
        returnAcademy: 'Route back into academy',
        sequenceFallback:
          'If the blocker is still, fundamentally, a sequence problem, return there first.',
      },
      packetPreview: {
        label: 'Packet preview',
      },
    },
    actions: {
      getHumanHelp: 'Get human help',
      copyPacket: 'Copy packet',
      copiedPacket: 'Copied packet',
      requestOfficeHours: 'Request office hours',
    },
    compass: {
      title: 'Support only exists to return the operator to the product',
      body:
        'Escalate cleanly, attach the packet, then go back to the surface that can move the work again. Academy is for sequence problems, tutor is for one knowable next step, and Autopilot is for live runtime truth.',
      status: {
        open: 'escalation open',
        standby: 'human help standby',
      },
      aside:
        'Human help should resolve the messy edge, not replace the product. The best support interaction ends with a clearer route back into Pico.',
      academy: {
        return: 'Return to academy',
        caption:
          'Go back here when the blocker was still fundamentally a lesson sequence problem.',
        note: 'Sequence',
      },
      tutor: {
        label: 'Ask tutor first',
        caption:
          'Use this when the product probably still knows the answer but you need the exact next move.',
        note: 'Knowable',
      },
      autopilot: {
        label: 'Re-enter Autopilot',
        caption:
          'Open the control room when the blocker depends on live runs, budget, alerts, or approvals.',
        note: 'Runtime',
      },
    },
    standards: {
      label: 'Escalation standards',
      title: 'Hand off the problem like a sharp operator',
      chip: 'route • evidence • return',
      cards: support.escalationStandards,
      packetPosture: {
        label: 'Packet posture',
        body:
          'Strong support starts with a clean packet. The best escalation reads like an operator handoff, not a panic dump.',
      },
      deskTone: {
        label: 'Desk tone',
        body:
          'Support should lower the temperature without slowing the route back into action.',
      },
      bestFirstMove: {
        label: 'Best first move',
        body:
          'Copy the packet, choose the right lane, and ask for the shortest route back into Academy, Tutor, or Autopilot.',
      },
    },
    desk: {
      label: 'Support desk',
      title: 'Send context, not noise',
      body:
        'Human help is for the part the product cannot truthfully close on its own. The faster you frame the blocker, the faster support can send you back to the product path.',
      callout: {
        title: 'If the next move is still obvious, go back and do it.',
        body:
          'Support exists for the messy edge, not for skipping the lesson, the tutor, or the live control surface.',
      },
      lanes: support.lanes.map((lane) => ({
        ...lane,
        cta: lane.id === 'fixing-existing' ? 'Start escalation' : 'Book office hours',
      })),
    },
    rail: {
      label: 'Operator rail',
      supportRequests: 'Support requests',
      tutorQuestions: 'Tutor questions',
      plan: {
        label: 'Plan',
        unknown: 'unknown',
        signIn: 'sign in',
      },
      activeSurface: {
        label: 'Active surface',
        none: 'none',
      },
      tryTheseFirst: 'Try these first',
      tryTutorFirst: 'Try tutor first',
      returnAcademy: 'Return to academy',
      openAutopilot: 'Open Autopilot',
      directLine: 'Direct line',
    },
    packet: {
      label: 'Diagnostic packet',
      title: 'Operator packet',
      chip: 'live context',
      preview: {
        route: 'Route',
        runtime: 'Runtime',
        return: 'Return',
        packet: 'Packet',
      },
      diagnostic: {
        title: 'Pico diagnostic packet',
        route: 'Route:',
        hostedSession: 'Hosted session:',
        hostedPlan: 'Hosted plan:',
        selectedTrack: 'Selected track:',
        completedLessons: 'Completed lessons:',
        nextLesson: 'Next lesson:',
        recoveryWorkspace: 'Recovery lesson workspace:',
        recoveryFocusedStep: 'Recovery lesson focused step:',
        recoveryProof: 'Recovery lesson proof:',
        activeSurface: 'Active surface:',
        lastOpenedLesson: 'Last opened lesson:',
        railCollapsed: 'Rail collapsed:',
        helpLaneOpen: 'Help lane open:',
        supportRequestsSent: 'Support requests sent:',
        tutorQuestionsAsked: 'Tutor questions asked:',
        approvalGateEnabled: 'Approval gate enabled:',
        hostedOnboardingStatus: 'Hosted onboarding status:',
        hostedOnboardingStep: 'Hosted onboarding step:',
        hostedWorkspace: 'Hosted workspace:',
        runtimeStatus: 'Runtime status:',
        gatewayUrl: 'Gateway URL:',
        runtimeBindings: 'Runtime bindings:',
        values: {
          unknown: 'unknown',
          na: 'n/a',
          none: 'none',
          notAvailable: 'not available',
          captured: 'captured',
          missing: 'missing',
          yes: 'yes',
          no: 'no',
        },
      },
      problemLabel: 'Problem:',
      openFormWithPacket: 'Open form with packet',
    },
    state: {
      label: 'Live operator state',
      hostedOnboarding: 'Hosted onboarding',
      runtimeStatus: 'Runtime status',
      currentTrack: 'Current track',
      currentTrackNotChosenYet: 'not chosen yet',
      nextLesson: 'Next lesson',
      nextLessonNone: 'none',
      lessonWorkspace: 'Lesson workspace',
      focusedStep: 'Focused step',
    },
    returnMap: {
      label: 'Return map',
      title: 'Human help should end in one cleaner route back into Pico',
      chip: 'operator return map',
      model: {
        label: 'Support return model',
        cards: [
          {
            title: '1. Route the blocker fast',
            body: 'Do not send a life story. Lead with the exact surface that broke.',
          },
          {
            title: '2. Attach the evidence',
            body: 'Send the command, runtime fact, or approval state that proves what failed.',
          },
          {
            title: '3. Return to the product',
            body: 'The response should restore momentum, not create a support maze.',
          },
        ],
      },
      anatomy: {
        label: 'Packet anatomy',
        body: 'A premium escalation packet always reads in the same order: route, evidence, return lane.',
        cards: [
          {
            title: 'Route first',
            body: 'Name the exact surface that broke.',
          },
          {
            title: 'Evidence second',
            body: 'Attach the signal that proves the failure.',
          },
          {
            title: 'Return third',
            body: 'Ask for the cleanest way back into motion.',
          },
        ],
      },
      paths: {
        lesson: {
          label: 'Lesson path',
          title: 'Resume the academy lane',
          body:
            'Use this when the blocker was still fundamentally a lesson or setup sequence problem.',
        },
        tutor: {
          label: 'Grounded answer',
          title: 'Ask tutor if the next move is still knowable',
          body:
            'Go back here when the product likely still knows the answer but you need the exact next step.',
          cta: 'Open tutor',
        },
        autopilot: {
          label: 'Runtime truth',
          title: 'Re-enter the control room',
          body:
            'Use Autopilot when the blocker depends on live runs, budget, approvals, or alert state.',
          cta: 'Open Autopilot',
        },
      },
    },
    shared: {
      stepNotSet: 'not set',
      runtime: {
        localOnly: 'local only',
        checking: 'checking',
        notAttached: 'not attached',
      },
      packetState: {
        copied: 'copied',
        proofAttached: 'proof attached',
        contextReady: 'context ready',
        needsProof: 'needs proof',
      },
      returnAcademy: 'academy',
      resumeLesson: 'Resume {lessonTitle}',
      openLesson: 'Open {lessonTitle}',
      stepsClear: '{completed}/{total} steps clear',
    },
  }
}

function buildPicoTutorPageMessages() {
  const tutor = PICO_GENERATED_CONTENT.tutor

  return {
    shell: {
      eyebrow: 'Grounded tutor',
      title: 'Ask for the exact next step',
      description:
        'Bring one concrete blocker, get one grounded move back, and return to the lesson or runtime route that can move the work.',
    },
    hero: {
      badge: 'Crit pulse',
      title: 'Attach the blocked lesson and narrow the answer to one move.',
      body:
        'Route the question through the actual lesson, command, or runtime edge that failed. That keeps the reply grounded enough to send you back into action.',
      lessonLane: {
        label: 'Lesson lane',
        connectBlockedLesson: 'Connect the blocked lesson',
      },
      replyState: {
        label: 'Reply state',
        readyToActOn: 'ready to act on',
        waitingForPreciseBlocker: 'waiting for a precise blocker',
      },
      connection: {
        label: 'Connection',
        hostedContextAvailable: 'hosted context available',
        hostedContextMissing: 'hosted context missing',
      },
      focusedStep: {
        label: 'Focused step',
        body: 'If the answer does not make this step clearer, leave tutor and use the cleaner route.',
      },
      packetPreview: {
        label: 'Crit packet preview',
        lane: 'Lane {value}',
        state: 'State {value}',
        focus: 'Focus {value}',
        output: 'Output {value}',
        noneAttached: 'none attached',
        groundedMove: 'one grounded move',
      },
      recentPressure: {
        label: 'Recent pressure',
        empty:
          'No recent question saved yet. Bring the first blocked step instead of a broad description of the whole project.',
      },
      signal: {
        answerReady: 'answer ready',
        reviewingBlocker: 'reviewing blocker',
        lessonAttached: 'lesson attached',
        awaitingBlocker: 'awaiting blocker',
        localOnly: 'local only',
        checking: 'checking',
        openaiConnected: 'openai connected',
        platformAccess: 'platform access',
        groundedMode: 'grounded mode',
        attachLesson: 'attach lesson',
        notSet: 'not set',
        lessonSteps: '{completed}/{total} steps',
      },
    },
    actions: {
      backToLesson: 'Back to lesson',
      openAcademy: 'Open academy',
      escalateToHumanHelp: 'Escalate to human help',
    },
    compass: {
      title: 'The tutor should end in motion, not another loop',
      body:
        'Use tutor only to recover one grounded next move. Return to the lesson when the answer is sufficient, inspect Autopilot when the runtime is the real blocker, and escalate only when neither route can tell the truth.',
      status: {
        answerReady: 'answer ready',
        lessonContextAttached: 'lesson context attached',
        awaitingBlocker: 'awaiting blocker',
      },
      aside:
        'A good tutor answer ends in one move. If it does not, leave the loop and return to the lesson, the runtime, or support.',
      items: {
        returnToBlockedLesson: 'Return to blocked lesson',
        returnToAcademy: 'Return to academy',
        returnCaption:
          'Go back here when the tutor answer still keeps the lesson path truthful.',
        resumeLane: 'Resume lane',
        inspectLiveControlRoom: 'Inspect live control room',
        inspectCaption:
          'Open this when the problem has shifted from knowable lesson logic to runtime state.',
        runtime: 'Runtime',
        openSupportLane: 'Open support lane',
        escalateCaption:
          'Escalate only when the tutor answer still does not give one concrete move.',
        escalate: 'Escalate',
      },
    },
    method: {
      label: 'Crit desk method',
      title: 'Treat each question like a studio critique',
      chip: 'frame • evidence • exit',
      cards: {
        frame: {
          label: '01 • Frame',
          title: 'Bring one blocked step',
          bodyWithLesson:
            'Tie the question to {lessonTitle}. The desk works best when the lesson route is already attached.',
          bodyWithoutLesson:
            'Name the exact step, command, or approval state that broke. Broad anxiety is not enough.',
        },
        evidence: {
          label: '02 • Evidence',
          title: 'Bring what actually happened',
          body: 'Paste the command, transcript, error, or runtime signal. This desk reviews evidence, not vibes.',
        },
        exit: {
          label: '03 • Exit',
          title: 'Leave with one move',
          body:
            'A good tutor answer gives one next action, one verification line, and a clean handoff if the evidence stays thin.',
        },
      },
      deskPosture: {
        label: 'Desk posture',
        body:
          'This is not a general chat surface. Use it as a review desk that narrows ambiguity into one next move.',
      },
      attachedLane: {
        label: 'Attached lane',
        bodyWithLesson:
          '{lessonTitle} is attached, so the tutor can answer against the real lesson brief instead of guessing.',
        bodyWithoutLesson:
          'No lesson is attached yet. Connect the blocked lesson if you want the tutor to stay grounded in the actual route.',
      },
      lessonReviewBoard: {
        lessonBrief: 'Lesson brief',
        deliverable: 'Deliverable',
        critiqueLine: 'Critique line',
      },
    },
    form: {
      label: 'Crit desk',
      mascotAlt: 'PicoMUTX tutor mascot',
      title: 'Bring one blocker to the desk',
      body:
        'Ask only when the lesson path is blocked. The answer should send you back into action, not into another loop of reading.',
      authAttached: 'Hosted identity and runtime context attached',
      readOnlyMode: 'Read-only tutor mode. Hosted session context is missing until you sign in.',
      whereYouAre: {
        label: 'Where you are',
        body: 'You are asking about {lessonTitle}. Keep the question tied to the step that is actually blocked.',
        lessonSteps: 'Lesson steps',
        focusedStep: 'Focused step',
        backToLesson: 'Back to lesson',
      },
      packet: {
        label: 'Crit packet',
        body: 'Bring just enough context for a sharp answer: route, failure, and exact expectation.',
        chip: 'route • failure • expectation',
        currentTrack: 'Current track',
        currentTrackNotChosenYet: 'not chosen yet',
        nextLesson: 'Next lesson',
        nextLessonNone: 'none',
        hostedOnboardingStep: 'Hosted onboarding step',
        sessionRequired: 'session required',
        runtimeStatus: 'Runtime status',
        notSynced: 'not synced',
      },
      questionProtocol: tutor.questionProtocol,
      examplePrompts: tutor.examplePrompts,
      questionPlaceholder: 'Describe the blocker, the exact step, and what you expected to happen.',
      blockedLessonLabel: 'Blocked lesson',
      noLessonSelected: 'No lesson selected',
      submitLoading: 'Finding the next step...',
      submitIdle: 'Get next step',
    },
    rail: {
      label: 'Operator rail',
      questionsAsked: 'Questions asked',
      liveAnswerState: 'Live answer state',
      thinking: 'thinking',
      waiting: 'waiting',
      recentQuestions: 'Recent questions',
      connection: {
        label: 'OpenAI connection',
        authPrompt:
          'Sign in to attach your own OpenAI key. Tutor still works in read-only mode without a personal connection.',
        checking: 'Checking whether your OpenAI key is already connected.',
        connectPrompt:
          'Connect an OpenAI key if you want your own live Tutor quota and model access.',
        connectedAs: 'Connected as {maskedKey}',
        connectedKey: 'Connected key',
        connectedBody:
          'Live Tutor answers now prefer your own OpenAI access before any platform fallback.',
        source: 'source: {value}',
        disconnecting: 'Disconnecting...',
        disconnect: 'Disconnect OpenAI',
        bringYourOwnKey: 'Bring your own OpenAI key',
        apiKeyPlaceholder: 'sk-proj-...',
        connecting: 'Connecting OpenAI...',
        connect: 'Connect OpenAI',
        platformHint:
          'Platform access is already available. Connecting your own key simply overrides the Tutor model budget and ownership path for this account.',
      },
      escalationRule: {
        label: 'Escalation rule',
        body:
          'If the answer still does not give you one concrete move, stop looping and open support with the lesson context attached.',
        cta: 'Open support lane',
      },
    },
    critique: {
      label: 'Studio critique',
      chips: {
        confidence: '{value} confidence',
        officialFallback: 'official fallback',
        humanEscalationLikely: 'human escalation likely',
      },
      singleNextMove: 'Single next move',
      situation: 'Situation',
      diagnosis: 'Diagnosis',
      steps: 'Steps',
      commands: 'Commands',
      reviewLine: 'Review line',
      fallbackRoute: 'Fallback route',
      empty:
        'Ask one blocker, not a whole story. Pico Tutor will ground the answer in lessons, the curated operator pack, and official docs when the question is version-sensitive.',
      emptyHowItWorks:
        'How this works: state the failing step, the expected result, and the exact failure. The answer should give you a concrete move, one verification step, and a clean escalation path if the evidence is still thin.',
    },
    matches: {
      label: 'Grounded lesson matches',
      bestMatch: 'best match',
      alternative: 'alt',
    },
    evidence: {
      label: 'Critique evidence',
      openSource: 'Open source',
    },
    officialLinks: {
      label: 'Official links',
    },
    exitRoute: {
      label: 'Exit route',
      returnToBlockedLesson: 'Return to blocked lesson',
      returnToAcademy: 'Return to academy',
      openAutopilot: 'Open Autopilot',
      openSupportLane: 'Open support lane',
      body:
        'The tutor should end in motion. Return to the lesson if the path is still clear, open Autopilot if the runtime is now the bottleneck, and escalate only when the product path stopped being truthful.',
    },
    escalationNote: {
      label: 'Escalation note',
      getHumanHelp: 'Get human help',
    },
    nextQuestion: {
      label: 'If the answer is still fuzzy',
    },
    errors: {
      loadOpenAIConnection: 'Failed to load OpenAI connection',
      tutorRequestFailed: 'Tutor request failed',
      malformedResponse: 'Tutor response came back malformed',
      pasteOpenAIKeyFirst: 'Paste an OpenAI API key first',
      connectOpenAIKey: 'Failed to connect the OpenAI key',
      disconnectOpenAIKey: 'Failed to disconnect the OpenAI key',
    },
    shared: {
      openLesson: 'Open {lessonTitle}',
    },
  }
}

function buildPicoWelcomeTourMessages() {
  return {
    quickHelp: 'Quick help',
    title: 'Learn the codex once, then close it.',
    close: 'Close',
    closeLabel: 'Close quick tour',
    controls: {
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
    },
    steps: {
      mission: {
        eyebrow: '01 Mission',
        title: 'Each Pico surface should have one dominant action.',
        body:
          'If a page looks equally about navigation, metrics, and explanation, it is lying. Find the one move that clears the route.',
        bullets: {
          currentSurface: 'You are in Chapter {chapter}: {label}.',
          backtrackPrevious: 'Backtrack target: {label}.',
          backtrackOnboarding: 'Backtrack target: onboarding.',
          forwardNext: 'Forward route: {label}.',
          forwardSupport: 'Forward route: support.',
        },
      },
      route: {
        academy: {
          eyebrow: '02 Mission first',
          title: 'The codex only wants one mission to matter.',
          body:
            'Open the dominant lesson, clear the visible step, and let the archive stay quiet until the main route is done.',
          bullets: {
            map: 'The map explains sequence. It should not compete with the mission.',
            proof: 'The current proof lane is the only part that should feel urgent.',
            currentSurface: 'Current surface: {pageTitle}.',
          },
        },
        tutor: {
          eyebrow: '02 One blocker',
          title: 'Tutor is for the exact next move.',
          body: 'Ask about the one command, file path, or validation step that is stopping the route.',
          bullets: {
            academy: 'If the sequence is wrong, return to Academy.',
            autopilot: 'If live runtime state is the blocker, open Autopilot.',
            currentSurface: 'Current surface: {pageTitle}.',
          },
        },
        autopilot: {
          eyebrow: '02 Runtime truth',
          title: 'Autopilot beats lesson copy when the system is live.',
          body:
            'Use the runtime surface when the answer depends on runs, alerts, approvals, or current state.',
          bullets: {
            academy: 'Return to Academy when the mission sequence is the real problem.',
            support: 'Escalate only after runtime truth is no longer enough.',
            currentSurface: 'Current surface: {pageTitle}.',
          },
        },
        support: {
          eyebrow: '02 Human edge',
          title: 'Support should send you back into motion fast.',
          body:
            'Bring the cleanest lesson or runtime packet possible, then return to the product instead of lingering here.',
          bullets: {
            notDefault: 'Support is the messy edge, not the default workspace.',
            packet: 'Carry lesson slug, proof, and blocker when you escalate.',
            currentSurface: 'Current surface: {pageTitle}.',
          },
        },
        onboarding: {
          eyebrow: '02 First win',
          title: 'Onboarding exists to compress the first visible success.',
          body:
            'Use it to get to one working runtime and one proof artifact, then move immediately into the codex.',
          bullets: {
            noise: 'Treat preferences as noise until the first success is real.',
            academy: 'Academy becomes useful once you need the exact lane.',
            currentSurface: 'Current surface: {pageTitle}.',
          },
        },
      },
      proof: {
        eyebrow: '03 Proof',
        title: 'Never leave the route without a proof artifact.',
        body:
          'The platform becomes trustworthy only when each cleared step leaves behind evidence, not just optimism.',
        bullets: {
          tutor: 'If the blocker is exact, ask Tutor.',
          autopilot: 'If the blocker is live system truth, open Autopilot.',
          support: 'If both fail, escalate to Support with the proof and notes.',
        },
      },
    },
  }
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
      surfaceCompass: {
        label: 'Surface compass',
        operatingRule: 'Operating rule',
      },
      shell: {
        nav: {
          onboarding: {
            label: 'Start',
            note: 'first visible win',
          },
          academy: {
            label: 'Lessons',
            note: 'the working path',
          },
          tutor: {
            label: 'Tutor',
            note: 'one grounded answer',
          },
          autopilot: {
            label: 'Autopilot',
            note: 'live control room',
          },
          support: {
            label: 'Human help',
            note: 'the messy edge',
          },
        },
        wordmark: {
          logoAlt: 'PicoMUTX logo',
          atlas: 'operator atlas',
        },
        robotCard: {
          signalLabel: 'Pico signal',
        },
        helpLane: {
          stayHereWhen: 'Stay here when',
          stayHereBody: 'the next move is still inside {chapter}.',
          recoveryRoute: 'Recovery route',
          openSupportLane: 'Open support lane',
          recoveryBody: 'Use this when the product route is no longer honest about the blocker.',
          continueSequence: 'Continue sequence',
          humanHelp: 'Human help',
          continueBody: 'Keep momentum if the next chapter is already the right tool.',
        },
        academyMode: {
          chapter: 'Chapter {chapter}',
          howThisWorks: 'How this works',
          map: 'Map',
          help: 'Help',
          routeMode: 'Route mode',
          focusModeActive: 'Focus mode is active.',
          mapStaysOpen: 'The map stays open.',
          previous: 'Previous: {label}',
          startOfSequence: 'Start of sequence',
          next: 'Next: {label}',
          finalChapter: 'Final chapter',
          backToMap: 'Back to map',
          proof: 'Proof',
        },
        defaultMode: {
          currentChapter: 'Current chapter',
          chapter: 'Chapter {chapter}',
          quickHelp: 'Quick help',
          previousChapter: 'Previous chapter',
          previousChapterAria: 'Go to previous chapter: {label}',
          nextChapter: 'Next chapter',
          nextChapterAria: 'Go to next chapter: {label}',
          goToOnboarding: 'Go to onboarding',
          goToSupport: 'Go to support',
          hideRecovery: 'Hide recovery',
          showRecovery: 'Show recovery',
          chapterNote: 'Chapter note',
          chapterNoteBody:
            'Use this chapter to cut uncertainty quickly and identify the next irreversible action.',
          prev: 'Prev',
          next: 'Next',
          openAcademyMap: 'Open academy map',
          openHelpLane: 'Open help lane',
          map: 'Map',
          help: 'Help',
          openMission: 'Open mission',
        },
        footer: {
          logoAlt: 'PicoMUTX logo',
          links: {
            releases: 'Releases',
            docs: 'Docs',
            github: 'GitHub',
            download: 'Download',
            privacy: 'Privacy',
          },
          copyright:
            '© {year} MUTX. PicoMUTX is a learning and operations platform for AI agent builders.',
        },
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
      supportPage: buildPicoSupportPageMessages(),
      tutorPage: buildPicoTutorPageMessages(),
      welcomeTour: buildPicoWelcomeTourMessages(),
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
