export type PicoRobotArt = {
  id: string
  src: string
  alt: string
}

export type PicoRobotMarketingHighlight = PicoRobotArt & {
  title: string
  caption: string
}

const picoRobotArt = {
  heroWave: {
    id: 'hero-wave',
    src: '/pico/robot/hero-wave.png',
    alt: 'PicoMUTX mascot floating above the product',
  },
  wave: {
    id: 'wave',
    src: '/pico/robot/wave.png',
    alt: 'PicoMUTX mascot waving hello',
  },
  running: {
    id: 'running',
    src: '/pico/robot/sprint.png',
    alt: 'PicoMUTX mascot running toward the next task',
  },
  thumbsUp: {
    id: 'thumbs-up',
    src: '/pico/robot/thumbs-up.png',
    alt: 'PicoMUTX mascot confirming a successful step',
  },
  sprout: {
    id: 'sprout',
    src: '/pico/robot/sprout.png',
    alt: 'PicoMUTX mascot growing from a fresh start',
  },
  atom: {
    id: 'atom',
    src: '/pico/robot/orbit.png',
    alt: 'PicoMUTX mascot framed by an atom mark',
  },
  builder: {
    id: 'builder',
    src: '/pico/robot/builder.png',
    alt: 'PicoMUTX mascot assembling a workflow',
  },
  guide: {
    id: 'guide',
    src: '/pico/robot/guide.png',
    alt: 'PicoMUTX mascot guiding a user through the next step',
  },
  point: {
    id: 'point',
    src: '/pico/robot/point.png',
    alt: 'PicoMUTX mascot pointing at run status',
  },
  celebrate: {
    id: 'celebrate',
    src: '/pico/robot/celebrate.png',
    alt: 'PicoMUTX mascot celebrating a completed milestone',
  },
  coffee: {
    id: 'coffee',
    src: '/pico/robot/coffee.png',
    alt: 'PicoMUTX mascot taking a brief pause between runs',
  },
  coins: {
    id: 'coins',
    src: '/pico/robot/coins.png',
    alt: 'PicoMUTX mascot watching the spend line',
  },
} satisfies Record<string, PicoRobotArt>

export const picoRobotArtById = picoRobotArt

export const picoRobotLandingHero: PicoRobotArt = picoRobotArt.heroWave

export const picoRobotLandingGallery: PicoRobotArt[] = [
  picoRobotArt.wave,
  picoRobotArt.builder,
  picoRobotArt.running,
  picoRobotArt.sprout,
  picoRobotArt.celebrate,
]

export const picoRobotMarketingHighlights: PicoRobotMarketingHighlight[] = [
  {
    ...picoRobotArt.guide,
    title: 'Onboarding that feels like the real product',
    caption:
      'PicoMUTX introduces the platform in the same voice it uses during live setup, so first contact does not feel disposable.',
  },
  {
    ...picoRobotArt.builder,
    title: 'Guidance that keeps setup moving',
    caption:
      'The coach stays focused on the next concrete action, whether you are learning, testing, or preparing Autopilot.',
  },
  {
    ...picoRobotArt.thumbsUp,
    title: 'Clear status inside the flow',
    caption:
      'Status, approvals, and saved outputs use one visual system so runtime state stays readable.',
  },
]

export const picoRobotAutopilotHighlights: PicoRobotMarketingHighlight[] = [
  {
    ...picoRobotArt.point,
    title: 'Runtime state at a glance',
    caption:
      'You should be able to read the current run state before changing a setting or approving an action.',
  },
  {
    ...picoRobotArt.coins,
    title: 'Escalation stays connected to the run',
    caption:
      'When risk rises, the page keeps the last execution, budget pressure, and pending decisions together.',
  },
  {
    ...picoRobotArt.atom,
    title: 'Review risky decisions',
    caption:
      'Approvals should stay visible long enough for a person to review them.',
  },
]

const picoRouteRobotSignals = {
  landing: {
    ...picoRobotArt.heroWave,
    title: 'Launch marker',
    caption:
      'Keep the landing simple, then let the product pages handle setup.',
  },
  onboarding: {
    ...picoRobotArt.guide,
    title: 'Guide marker',
    caption:
      'Onboarding should give one clear setup step and keep the agent packet in view.',
  },
  academy: {
    ...picoRobotArt.sprout,
    title: 'Lesson marker',
    caption:
      'Academy keeps setup moving one lesson at a time.',
  },
  tutor: {
    ...picoRobotArt.builder,
    title: 'Tutor marker',
    caption:
      'Tutor should answer one blocker and send you back to setup.',
  },
  autopilot: {
    ...picoRobotArt.point,
    title: 'Runtime marker',
    caption:
      'Autopilot keeps run state, spend, and approvals close together.',
  },
  support: {
    ...picoRobotArt.coffee,
    title: 'Support marker',
    caption:
      'Support is for setup that needs a person: keys, hosting, integrations, or custom implementation.',
  },
} satisfies Record<string, PicoRobotMarketingHighlight>

export function getPicoRouteRobot(pathname: string, academyMode = false): PicoRobotMarketingHighlight {
  if (academyMode || pathname.startsWith('/pico/academy')) {
    return picoRouteRobotSignals.academy
  }

  if (pathname.startsWith('/pico/onboarding')) {
    return picoRouteRobotSignals.onboarding
  }

  if (pathname.startsWith('/pico/tutor')) {
    return picoRouteRobotSignals.tutor
  }

  if (pathname.startsWith('/pico/autopilot')) {
    return picoRouteRobotSignals.autopilot
  }

  if (pathname.startsWith('/pico/support')) {
    return picoRouteRobotSignals.support
  }

  return picoRouteRobotSignals.landing
}
