import type { CSSProperties } from 'react'

interface FireflyDot {
  x: number
  y: number
  s: number
  d: number
  t: number
  gold: boolean
}

/** Espelha `FireflyBackground.tsx` do mobile */
const DEFAULT_DOTS_10: FireflyDot[] = [
  { x: 12, y: 18, s: 2.5, d: 0, t: 4.2, gold: false },
  { x: 78, y: 12, s: 3.5, d: 1.4, t: 5.1, gold: true },
  { x: 32, y: 62, s: 2, d: 0.6, t: 3.8, gold: false },
  { x: 88, y: 48, s: 3, d: 2.3, t: 4.7, gold: false },
  { x: 22, y: 42, s: 2, d: 1.9, t: 3.2, gold: true },
  { x: 62, y: 28, s: 2.5, d: 0.9, t: 5.5, gold: false },
  { x: 48, y: 72, s: 3, d: 3.1, t: 4.0, gold: true },
  { x: 92, y: 35, s: 2, d: 1.6, t: 3.6, gold: false },
  { x: 55, y: 55, s: 2.5, d: 2.8, t: 4.4, gold: false },
  { x: 8, y: 58, s: 3, d: 0.3, t: 5.0, gold: true },
]

const DEFAULT_DOTS_7: FireflyDot[] = [
  { x: 14, y: 12, s: 2.4, d: 0.3, t: 4.2, gold: false },
  { x: 78, y: 10, s: 3, d: 1.1, t: 5.1, gold: true },
  { x: 24, y: 32, s: 2, d: 0.7, t: 3.8, gold: false },
  { x: 86, y: 38, s: 2.6, d: 2.0, t: 4.7, gold: false },
  { x: 10, y: 46, s: 2.2, d: 1.6, t: 3.4, gold: true },
  { x: 60, y: 18, s: 2.4, d: 0.9, t: 5.3, gold: false },
  { x: 48, y: 54, s: 2.8, d: 2.7, t: 4.0, gold: true },
]

export interface FireflyBackgroundProps {
  count?: number
  className?: string
}

function getDots(count: number): FireflyDot[] {
  if (count <= 7) return DEFAULT_DOTS_7.slice(0, count)
  return DEFAULT_DOTS_10.slice(0, count)
}

export function FireflyBackground({ count = 10, className = '' }: FireflyBackgroundProps) {
  const dots = getDots(count)
  const wrapClass = `broto-splash-fireflies${className ? ` ${className}` : ''}`

  return (
    <div className={wrapClass} aria-hidden>
      {dots.map((dot, i) => (
        <span
          key={`${dot.x}-${dot.y}-${i}`}
          className={`broto-splash-firefly${dot.gold ? ' broto-splash-firefly--gold' : ' broto-splash-firefly--green'}`}
          style={
            {
              '--ff-x': `${dot.x}%`,
              '--ff-y': `${dot.y}%`,
              '--ff-s': `${dot.s}px`,
              '--ff-t': `${dot.t}s`,
              '--ff-d': `${dot.d}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
