interface RoutineHeroHeaderProps {
  dateLine: string
  completed: number
  total: number
}

export function RoutineHeroHeader({ dateLine, completed, total }: RoutineHeroHeaderProps) {
  const ratio = total > 0 ? completed / total : 0
  const pct = Math.round(ratio * 100)
  const r = 44
  const c = 2 * Math.PI * r
  const dash = c * (1 - ratio)

  return (
    <header className="broto-routine-hero">
      <div className="broto-routine-hero__main">
        <p className="broto-routine-hero__date">{dateLine}</p>
        <h1 className="broto-routine-hero__title">Sua Rotina</h1>
        <p className="broto-routine-hero__subtitle">
          {completed} de {total} sessões concluídas — continue firme.
        </p>
        <div
          className="broto-routine-hero__bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="broto-routine-hero__bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="broto-routine-hero__ring" aria-hidden>
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke="var(--routine-mint, #34e8bd)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dash}
            transform="rotate(-90 56 56)"
          />
        </svg>
        <div className="broto-routine-hero__ring-label">
          <span className="broto-routine-hero__ring-num">
            {completed}/{total}
          </span>
          <span className="broto-routine-hero__ring-cap">{'SESSÕES'}</span>
        </div>
      </div>
    </header>
  )
}
