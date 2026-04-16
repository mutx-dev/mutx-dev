export type PicoRobotArt = {
  id: string
  src: string
  alt: string
  title: string
  caption: string
}

const catalog = {
  heroWave: {
    id: 'hero-wave',
    src: '/pico/robot/hero-wave.png',
    alt: 'PicoMUTX robot waving in a bright green halo',
    title: 'Hero wave',
    caption: 'A clear welcome surface for the guided Pico flow.',
  },
  wave: {
    id: 'wave',
    src: '/pico/robot/wave.png',
    alt: 'PicoMUTX robot waving in a neon green ring',
    title: 'Wave',
    caption: 'Signals the friendly starting point without losing the operator feel.',
  },
  builder: {
    id: 'builder',
    src: '/pico/robot/builder.png',
    alt: 'PicoMUTX robot seated while working with floating interface panels',
    title: 'Builder',
    caption: 'Turns setup work into a guided build instead of blind configuration.',
  },
  orbit: {
    id: 'orbit',
    src: '/pico/robot/orbit.png',
    alt: 'PicoMUTX robot holding a glowing orb with orbital lines',
    title: 'Orbit',
    caption: 'Keeps the system map readable when the runtime gets more complex.',
  },
  sprint: {
    id: 'sprint',
    src: '/pico/robot/sprint.png',
    alt: 'PicoMUTX robot running forward with motion streaks',
    title: 'Sprint',
    caption: 'Fits the moments where the platform should feel fast and decisive.',
  },
  sprout: {
    id: 'sprout',
    src: '/pico/robot/sprout.png',
    alt: 'PicoMUTX robot kneeling beside a glowing sprout',
    title: 'Sprout',
    caption: 'Good for onboarding and the early steps of a new automation path.',
  },
  thumbsUp: {
    id: 'thumbs-up',
    src: '/pico/robot/thumbs-up.png',
    alt: 'PicoMUTX robot giving a thumbs-up beside a bright star',
    title: 'Thumbs up',
    caption: 'Marks the moments where the product confirms the path is grounded.',
  },
  guide: {
    id: 'guide',
    src: '/pico/robot/guide.png',
    alt: 'PicoMUTX robot pointing upward with a small lightning icon',
    title: 'Guide',
    caption: 'Useful when the product needs to teach a next step directly.',
  },
  relax: {
    id: 'relax',
    src: '/pico/robot/relax.png',
    alt: 'PicoMUTX robot relaxing in a chair with oversized sunglasses',
    title: 'Relax',
    caption: 'Softens quiet states without making the surface feel idle or fake.',
  },
  coffee: {
    id: 'coffee',
    src: '/pico/robot/coffee.png',
    alt: 'PicoMUTX robot holding a steaming mug',
    title: 'Coffee',
    caption: 'Fits human-in-the-loop moments where a calm review matters more than speed.',
  },
  coins: {
    id: 'coins',
    src: '/pico/robot/coins.png',
    alt: 'PicoMUTX robot juggling glowing coins',
    title: 'Budget',
    caption: 'Matches spend visibility, pricing, and threshold decision points.',
  },
  point: {
    id: 'point',
    src: '/pico/robot/point.png',
    alt: 'PicoMUTX robot pointing forward with a bright green beam trail',
    title: 'Point',
    caption: 'Works as a directional cue when the interface needs a stronger call to action.',
  },
  celebrate: {
    id: 'celebrate',
    src: '/pico/robot/celebrate.png',
    alt: 'PicoMUTX robot jumping with both hands raised',
    title: 'Celebrate',
    caption: 'Reserves energy for visible wins instead of using motion everywhere.',
  },
} as const satisfies Record<string, PicoRobotArt>

export const picoRobotArtById = catalog

export const picoRobotLandingGallery = [
  catalog.wave,
  catalog.builder,
  catalog.orbit,
  catalog.sprint,
  catalog.sprout,
  catalog.thumbsUp,
  catalog.guide,
  catalog.relax,
  catalog.coffee,
  catalog.coins,
  catalog.point,
  catalog.celebrate,
]

export const picoRobotMarketingHighlights = [
  catalog.builder,
  catalog.sprout,
  catalog.thumbsUp,
]

export const picoRobotAutopilotHighlights = [
  catalog.point,
  catalog.coffee,
]
