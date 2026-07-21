import { cn } from '@/lib/utils'

export type PicoRouteSignal = {
  index: string
  label: string
  title: string
  caption: string
}

const routeSignals = {
  landing: {
    index: '00',
    label: 'Launch marker',
    title: 'Start with one working path.',
    caption: 'Keep the landing simple, then let the product pages handle setup.',
  },
  onboarding: {
    index: '01',
    label: 'Guide marker',
    title: 'Install. Run. Record.',
    caption: 'Onboarding keeps one setup step and the agent packet in view.',
  },
  academy: {
    index: '02',
    label: 'Lesson marker',
    title: 'Clear one chapter at a time.',
    caption: 'Academy keeps setup moving one lesson at a time.',
  },
  tutor: {
    index: '03',
    label: 'Tutor marker',
    title: 'Name the blocker precisely.',
    caption: 'Tutor answers one blocker and sends you back to setup.',
  },
  autopilot: {
    index: '04',
    label: 'Runtime marker',
    title: 'Read state before acting.',
    caption: 'Autopilot keeps run state, spend, and approvals close together.',
  },
  support: {
    index: '05',
    label: 'Support marker',
    title: 'Bring the shortest useful packet.',
    caption: 'Support handles keys, hosting, integrations, and implementation judgment.',
  },
} satisfies Record<string, PicoRouteSignal>

export function getPicoRouteSignal(pathname: string, academyMode = false): PicoRouteSignal {
  if (academyMode || pathname.startsWith('/pico/academy')) return routeSignals.academy
  if (pathname.startsWith('/pico/onboarding')) return routeSignals.onboarding
  if (pathname.startsWith('/pico/tutor')) return routeSignals.tutor
  if (pathname.startsWith('/pico/autopilot')) return routeSignals.autopilot
  if (pathname.startsWith('/pico/support')) return routeSignals.support
  return routeSignals.landing
}

type PicoSignalDiagramProps = PicoRouteSignal & {
  className?: string
  compact?: boolean
}

export function PicoSignalDiagram({
  index,
  label,
  title,
  caption,
  className,
  compact = false,
}: PicoSignalDiagramProps) {
  return (
    <figure
      className={cn(
        'overflow-hidden border border-[#0a0a09] bg-[#f3f0e8] text-[#0a0a09]',
        className,
      )}
    >
      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-[#0a0a09] px-4 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.16em]">
        <span>{label}</span>
        <span className="text-[#c83b00]">Signal / {index}</span>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'relative grid overflow-hidden border-b border-[#0a0a09] [background-image:linear-gradient(rgba(10,10,9,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,9,0.12)_1px,transparent_1px)] [background-size:2rem_2rem]',
          compact ? 'min-h-36' : 'aspect-[4/3] min-h-48',
        )}
      >
        <span className="absolute left-4 top-3 font-[family:var(--font-site-body)] text-[clamp(4rem,10vw,7rem)] font-semibold leading-none tracking-[-0.1em]">
          {index}
        </span>
        <span className="absolute bottom-4 left-4 h-3 w-3 bg-[#ff4d00]" />
        <span className="absolute bottom-[1.35rem] left-7 right-4 h-px bg-[#0a0a09]" />
        <span className="absolute bottom-4 right-4 h-3 w-3 border border-[#0a0a09] bg-[#f3f0e8]" />
        <span className="absolute right-4 top-4 h-12 w-12 border border-[#0a0a09] before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-[#0a0a09] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:bg-[#0a0a09]" />
      </div>

      <figcaption className={compact ? 'p-4' : 'p-5'}>
        <p className="font-[family:var(--font-site-body)] text-2xl font-semibold leading-none tracking-[-0.055em]">
          {title}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#4f4d48]">{caption}</p>
      </figcaption>
    </figure>
  )
}
