'use client'

import type { CSSProperties } from 'react'
import {
  Activity,
  Code2,
  DatabaseZap,
  Handshake,
  Radar,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type AgentSliderKind =
  | 'dev'
  | 'market'
  | 'deal'
  | 'ops'
  | 'growth'
  | 'security'
  | 'data'

export type AgentSliderAgent = {
  name: string
  description: string
  kind?: AgentSliderKind
}

export type AgentSliderProps = {
  agents?: AgentSliderAgent[]
  ariaLabel?: string
  className?: string
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  speed?: number
  onAgentClick?: (agent: AgentSliderAgent, index: number) => void
}

const DEFAULT_AGENTS: AgentSliderAgent[] = [
  {
    kind: 'dev',
    name: 'Dev Agent',
    description: 'Writes, tests, and ships code autonomously.',
  },
  {
    kind: 'market',
    name: 'Market Agent',
    description: 'Monitors signals and surfaces meaningful changes.',
  },
  {
    kind: 'deal',
    name: 'Deal Agent',
    description: 'Evaluates opportunities and flags high-conviction plays.',
  },
  {
    kind: 'ops',
    name: 'Ops Agent',
    description: 'Detects issues and executes fixes in real time.',
  },
  {
    kind: 'growth',
    name: 'Growth Agent',
    description: 'Iterates content and distribution based on performance.',
  },
  {
    kind: 'security',
    name: 'Security Agent',
    description: 'Scans and mitigates risk continuously.',
  },
  {
    kind: 'data',
    name: 'Data Agent',
    description: 'Maintains and evolves pipelines automatically.',
  },
]

const ICONS: Record<AgentSliderKind, LucideIcon> = {
  dev: Code2,
  market: Radar,
  deal: Handshake,
  ops: Activity,
  growth: TrendingUp,
  security: ShieldCheck,
  data: DatabaseZap,
}

export function AgentSlider({
  agents = DEFAULT_AGENTS,
  ariaLabel = 'Autonomous agent types',
  className,
  direction = 'left',
  pauseOnHover = true,
  speed = 42,
  onAgentClick,
}: AgentSliderProps) {
  const safeSpeed = Math.max(18, speed)
  const style = {
    '--agent-slider-duration': `${safeSpeed}s`,
    '--agent-slider-mobile-duration': `${Math.round(safeSpeed * 1.35)}s`,
  } as CSSProperties

  function renderGroup(isDuplicate = false) {
    return (
      <div className="agent-group" aria-hidden={isDuplicate}>
        {agents.map((agent, index) => {
          const kind = agent.kind ?? DEFAULT_AGENTS[index % DEFAULT_AGENTS.length]?.kind ?? 'dev'
          const Icon = ICONS[kind]

          return (
            <button
              key={`${isDuplicate ? 'duplicate' : 'primary'}-${agent.name}-${index}`}
              type="button"
              className="agent-card"
              tabIndex={isDuplicate ? -1 : undefined}
              aria-label={`${agent.name}: ${agent.description}`}
              onClick={() => onAgentClick?.(agent, index)}
            >
              <span className="agent-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="agent-copy">
                <span className="agent-name">{agent.name}</span>
                <span className="agent-description">{agent.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <section
      className={['agent-slider', className].filter(Boolean).join(' ')}
      style={style}
      aria-label={ariaLabel}
      data-direction={direction}
      data-pause={pauseOnHover ? 'true' : 'false'}
    >
      <div className="agent-viewport">
        <div className="agent-track">
          {renderGroup()}
          {renderGroup(true)}
        </div>
      </div>

      <style>{`
        .agent-slider {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-block: 1px solid rgba(var(--pico-accent-rgb, 164, 255, 92), 0.12);
          background:
            radial-gradient(
              circle at 22% 50%,
              rgba(var(--pico-accent-rgb, 164, 255, 92), 0.09),
              transparent 28%
            ),
            linear-gradient(
              90deg,
              rgba(5, 8, 13, 0.94),
              rgba(11, 18, 18, 0.88) 48%,
              rgba(5, 8, 13, 0.94)
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.035),
            inset 0 -1px 0 rgba(255, 255, 255, 0.025);
          isolation: isolate;
        }

        .agent-slider::before,
        .agent-slider::after {
          content: '';
          position: absolute;
          inset-block: 0;
          z-index: 2;
          width: min(12vw, 9rem);
          pointer-events: none;
        }

        .agent-slider::before {
          left: 0;
          background: linear-gradient(90deg, rgba(5, 8, 13, 0.98), transparent);
        }

        .agent-slider::after {
          right: 0;
          background: linear-gradient(270deg, rgba(5, 8, 13, 0.98), transparent);
        }

        .agent-viewport {
          overflow: hidden;
          padding: 0.82rem 0;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
        }

        .agent-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: agent-marquee var(--agent-slider-duration) linear infinite;
        }

        .agent-slider[data-direction='right'] .agent-track {
          animation-direction: reverse;
        }

        .agent-slider[data-pause='true']:hover .agent-track,
        .agent-slider[data-pause='true']:focus-within .agent-track {
          animation-play-state: paused;
        }

        .agent-group {
          display: flex;
          gap: 0.72rem;
          padding-inline-end: 0.72rem;
        }

        .agent-card {
          appearance: none;
          position: relative;
          display: grid;
          grid-template-columns: 2.15rem minmax(0, 1fr);
          gap: 0.72rem;
          align-items: center;
          width: clamp(13.5rem, 17vw, 16.4rem);
          height: 4.55rem;
          padding: 0.78rem 0.92rem;
          border: 1px solid rgba(var(--pico-accent-rgb, 164, 255, 92), 0.13);
          border-radius: 1.1rem;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.012)),
            rgba(7, 11, 15, 0.72);
          color: var(--pico-text, #f4f7ef);
          font: inherit;
          text-align: left;
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.055);
          cursor: pointer;
          transform: translateZ(0);
          transition:
            opacity 170ms ease,
            transform 170ms ease,
            border-color 170ms ease,
            background 170ms ease,
            box-shadow 170ms ease;
          touch-action: manipulation;
        }

        .agent-slider:is(:hover, :focus-within) .agent-card {
          opacity: 0.58;
        }

        .agent-card:hover,
        .agent-card:focus,
        .agent-card:active {
          z-index: 3;
          opacity: 1;
          transform: scale(1.065);
          border-color: rgba(var(--pico-accent-rgb, 164, 255, 92), 0.42);
          background:
            radial-gradient(
              circle at 18% 18%,
              rgba(var(--pico-accent-rgb, 164, 255, 92), 0.16),
              transparent 52%
            ),
            linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.018)),
            rgba(8, 14, 16, 0.9);
          box-shadow:
            0 18px 52px rgba(var(--pico-accent-rgb, 164, 255, 92), 0.12),
            0 20px 54px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .agent-card:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(var(--pico-accent-rgb, 164, 255, 92), 0.24),
            0 18px 52px rgba(var(--pico-accent-rgb, 164, 255, 92), 0.12),
            0 20px 54px rgba(0, 0, 0, 0.32);
        }

        .agent-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.15rem;
          height: 2.15rem;
          border: 1px solid rgba(var(--pico-accent-rgb, 164, 255, 92), 0.16);
          border-radius: 0.8rem;
          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(var(--pico-accent-rgb, 164, 255, 92), 0.18),
              transparent 70%
            ),
            rgba(255, 255, 255, 0.025);
          color: var(--pico-accent-bright, #ebffbf);
          flex-shrink: 0;
        }

        .agent-icon svg {
          width: 1.22rem;
          height: 1.22rem;
          stroke: currentColor;
          stroke-width: 1.75;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .agent-copy {
          position: relative;
          display: grid;
          gap: 0.22rem;
          min-width: 0;
        }

        .agent-name {
          color: var(--pico-text, #f4f7ef);
          font-family: var(--pico-font-accent, inherit);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transform: translateY(0.42rem);
          transition:
            color 170ms ease,
            transform 170ms ease;
        }

        .agent-description {
          color: var(--pico-text-secondary, rgba(244, 247, 239, 0.68));
          font-size: 0.74rem;
          line-height: 1.28;
          opacity: 0;
          transform: translateY(0.34rem);
          transition:
            opacity 160ms ease,
            transform 160ms ease;
        }

        .agent-card:hover .agent-name,
        .agent-card:focus .agent-name,
        .agent-card:active .agent-name {
          color: var(--pico-accent-bright, #ebffbf);
          transform: translateY(0);
        }

        .agent-card:hover .agent-description,
        .agent-card:focus .agent-description,
        .agent-card:active .agent-description {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes agent-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (max-width: 700px) {
          .agent-viewport {
            padding: 0.68rem 0;
          }

          .agent-track {
            animation-duration: var(--agent-slider-mobile-duration);
          }

          .agent-group {
            gap: 0.55rem;
            padding-inline-end: 0.55rem;
          }

          .agent-card {
            width: 13.2rem;
            height: 4.72rem;
            border-radius: 1rem;
          }

          .agent-description {
            font-size: 0.71rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .agent-viewport {
            overflow-x: auto;
            -webkit-mask-image: none;
            mask-image: none;
          }

          .agent-track {
            animation: none;
          }

          .agent-group[aria-hidden='true'] {
            display: none;
          }

          .agent-card,
          .agent-name,
          .agent-description {
            transition: none;
          }
        }
      `}</style>
    </section>
  )
}
