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
    alt: 'PicoMUTX mascot floating above the product surface',
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
    alt: 'PicoMUTX mascot guiding an operator through the next step',
  },
  point: {
    id: 'point',
    src: '/pico/robot/point.png',
    alt: 'PicoMUTX mascot pointing at a control signal',
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
    title: 'Guidance that keeps operators moving',
    caption:
      'The coach stays oriented around the next concrete action, whether the operator is learning, testing, or pushing toward autopilot.',
  },
  {
    ...picoRobotArt.thumbsUp,
    title: 'Confidence signals inside the flow',
    caption:
      'Status, approvals, and proof points are framed as part of the same visual system, which makes the runtime feel trustworthy and legible.',
  },
]

export const picoRobotAutopilotHighlights: PicoRobotMarketingHighlight[] = [
  {
    ...picoRobotArt.point,
    title: 'Runtime posture at a glance',
    caption:
      'The operator should be able to read the state of the control room before touching any setting or approving any action.',
  },
  {
    ...picoRobotArt.coins,
    title: 'Escalation stays connected to the run',
    caption:
      'When risk rises, the surface should keep the last execution, budget pressure, and pending decisions tied together.',
  },
  {
    ...picoRobotArt.atom,
    title: 'Trust comes from visible decisions',
    caption:
      'Approvals are only credible when they read like durable operator calls instead of temporary UI toasts.',
  },
]
