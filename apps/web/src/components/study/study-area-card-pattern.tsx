/**
 * Decorative SVG pattern + per-area CSS variable overrides for study area cards.
 * Shared between StudyArea and Home quick access.
 */
export const AREA_ACCENT_VARS: Record<string, { dim: string; glow: string }> = {
  linguagens: { dim: 'rgba(45,212,168,0.10)', glow: 'rgba(45,212,168,0.12)' },
  'ciencias-humanas': { dim: 'rgba(96,165,250,0.10)', glow: 'rgba(96,165,250,0.12)' },
  'ciencias-natureza': { dim: 'rgba(167,139,250,0.10)', glow: 'rgba(167,139,250,0.12)' },
  matematica: { dim: 'rgba(245,200,66,0.10)', glow: 'rgba(245,200,66,0.12)' },
}

export function StudyAreaCardPattern({ areaKey }: { areaKey: string }) {
  if (areaKey === 'linguagens') {
    return (
      <svg
        className="study-area-card__pattern"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M20 80c30-40 60 20 90-10s50-50 80-20"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M10 120c40-30 70 10 100-20s40-40 70-10"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
        <circle cx="160" cy="40" r="20" fill="currentColor" opacity="0.05" />
        <circle cx="40" cy="150" r="15" fill="currentColor" opacity="0.04" />
      </svg>
    )
  }
  if (areaKey === 'ciencias-humanas') {
    return (
      <svg
        className="study-area-card__pattern"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
        <line x1="40" y1="100" x2="160" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <line x1="100" y1="40" x2="100" y2="160" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
    )
  }
  if (areaKey === 'ciencias-natureza') {
    return (
      <svg
        className="study-area-card__pattern"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M100 20 L100 180" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <path
          d="M100 60 C120 60 130 40 140 50"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M100 90 C80 90 70 70 60 80"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M100 120 C125 120 135 100 145 110"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.25"
        />
        <circle cx="100" cy="170" r="8" fill="currentColor" opacity="0.04" />
      </svg>
    )
  }
  if (areaKey === 'matematica') {
    return (
      <svg
        className="study-area-card__pattern"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          x="50"
          y="50"
          width="100"
          height="100"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          opacity="0.15"
          rx="4"
        />
        <line x1="50" y1="100" x2="150" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <line x1="100" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <text x="70" y="90" fontSize="14" fill="currentColor" opacity="0.08" fontFamily="serif">
          ∑
        </text>
        <text x="115" y="130" fontSize="12" fill="currentColor" opacity="0.06" fontFamily="serif">
          π
        </text>
      </svg>
    )
  }
  return null
}
