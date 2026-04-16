'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function PicoWipPage() {
  return (
    <div className="pico-wip-root">
      <div className="pico-wip-pulse" />
      <div className="pico-wip-content">
        <div className="pico-wip-icon">
          <Image
            src="/pico/robot/celebrate.png"
            alt="PicoMUTX robot celebrating an upcoming release"
            width={320}
            height={320}
            className="pico-wip-robot"
            priority
          />
        </div>
        <h1 className="pico-wip-title">Coming Soon</h1>
        <p className="pico-wip-subtitle">
          This corner of PicoMUTX is still under construction.
        </p>
        <div className="pico-wip-links">
          <Link href="/" className="pico-wip-btn-primary">
            Back to PicoMUTX
          </Link>
          <Link href="https://mutx.dev" className="pico-wip-btn-secondary">
            MUTX Platform
          </Link>
        </div>
      </div>

      <style jsx>{`
        .pico-wip-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--pico-bg);
        }

        .pico-wip-pulse {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(var(--pico-accent-rgb), 0.08) 0%,
            transparent 70%
          );
          animation: wip-pulse 3s ease-in-out infinite;
        }

        @keyframes wip-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        .pico-wip-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
        }

        .pico-wip-icon {
          margin: 0 auto 1.5rem;
          opacity: 0.9;
        }

        .pico-wip-robot {
          display: block;
          width: min(14rem, 44vw);
          height: auto;
          padding: 0.65rem;
          border-radius: 1.6rem;
          border: 1px solid rgba(164, 255, 92, 0.18);
          background:
            radial-gradient(circle at 50% 14%, rgba(164, 255, 92, 0.18), transparent 48%),
            linear-gradient(180deg, rgba(5, 10, 5, 0.98), rgba(2, 4, 2, 1));
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28);
        }

        .pico-wip-title {
          font-family: var(--pico-font-display);
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--pico-accent);
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
        }

        .pico-wip-subtitle {
          font-family: var(--pico-font-body);
          font-size: 1.05rem;
          color: var(--pico-text-secondary);
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        .pico-wip-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .pico-wip-btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.75rem;
          border-radius: var(--pico-radius-full);
          background: var(--pico-accent);
          color: var(--pico-accent-contrast);
          font-family: var(--pico-font-body);
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 0 24px rgba(var(--pico-accent-rgb), 0.2);
        }

        .pico-wip-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(var(--pico-accent-rgb), 0.35);
        }

        .pico-wip-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.75rem;
          border-radius: var(--pico-radius-full);
          background: transparent;
          color: var(--pico-text-secondary);
          font-family: var(--pico-font-body);
          font-weight: 500;
          font-size: 0.9rem;
          text-decoration: none;
          border: 1px solid var(--pico-border);
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .pico-wip-btn-secondary:hover {
          border-color: var(--pico-border-hover);
          color: var(--pico-text);
        }
      `}</style>
    </div>
  )
}
