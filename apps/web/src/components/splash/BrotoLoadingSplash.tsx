import { useId } from 'react'
import { FireflyBackground } from '@/components/splash/FireflyBackground'

/**
 * Tela de carregamento alinhada ao splash animado do mobile (`app/_layout.tsx` → AnimatedSplash).
 */
export function BrotoLoadingSplash() {
  const raw = useId()
  const safeId = raw.replace(/:/g, '')
  const glowId = `broto-splash-glow-${safeId}`
  const wordmarkId = `broto-splash-wordmark-${safeId}`

  return (
    <div
      className="broto-loading-splash"
      role="status"
      aria-live="polite"
      aria-label="Carregando broto"
    >
      <div className="broto-loading-splash__gradient" aria-hidden />
      <FireflyBackground count={10} />

      <div className="broto-loading-splash__center">
        <div className="broto-loading-splash__glow-wrap">
          <svg
            className="broto-loading-splash__glow-svg"
            width={160}
            height={160}
            viewBox="0 0 160 160"
            aria-hidden
          >
            <defs>
              <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.28" />
                <stop offset="50%" stopColor="var(--teal-500)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="80" cy="80" r="80" fill={`url(#${glowId})`} />
          </svg>
        </div>

        <div className="broto-loading-splash__emoji-float">
          <div className="broto-loading-splash__emoji-box">
            <span className="broto-loading-splash__emoji">{'\u{1F331}'}</span>
          </div>
        </div>

        <div className="broto-loading-splash__copy">
          <svg
            className="broto-loading-splash__wordmark"
            width={180}
            height={56}
            viewBox="0 0 180 56"
            aria-hidden
          >
            <defs>
              <linearGradient id={wordmarkId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--teal-300)" />
                <stop offset="40%" stopColor="var(--teal-500)" />
                <stop offset="100%" stopColor="var(--gold-accent)" />
              </linearGradient>
            </defs>
            <text
              x="90"
              y="48"
              textAnchor="middle"
              fill={`url(#${wordmarkId})`}
              className="broto-loading-splash__wordmark-text"
            >
              broto
            </text>
          </svg>
          <p className="broto-loading-splash__tagline">ESTUDE & FLORESCA</p>
        </div>
      </div>
    </div>
  )
}
