import { useId } from 'react'
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'

/** Alinhado a Home.tsx e DashboardStudyStats (meta gamificada do dia). */
const META_QUESTOES_DIA = 5

function PetXpRing({ pct, size }: { pct: number; size: number }) {
  const rawId = useId()
  const gradId = `broto-pet-ring-grad-${rawId.replace(/:/g, '')}`
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const dash = (p / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      className="broto-home-pet-banner__ring-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(110, 167, 131, 0.95)" />
          <stop offset="100%" stopColor="rgba(74, 139, 102, 0.88)" />
        </linearGradient>
      </defs>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="broto-home-pet-banner__ring-track"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="broto-home-pet-banner__ring-progress"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </g>
    </svg>
  )
}

export function HomePetBanner() {
  const { pet, loading } = usePet()

  const fase = pet?.fase ?? 'semente'
  const brotoNome = pet?.nome?.trim() || 'Broto'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpInLevel = xp % 100
  const questoesHoje = pet?.questoesHoje ?? 0
  const acertosHoje = pet?.acertosHoje ?? 0
  const streak = pet?.streak ?? 0
  const metaCount = Math.min(questoesHoje, META_QUESTOES_DIA)
  const hitPct = questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : null
  const metaPct = loading ? 0 : Math.round((metaCount / META_QUESTOES_DIA) * 100)
  const xpPct = loading ? 0 : Math.min(100, Math.max(0, xpInLevel))

  /** Diâmetro do anel XP — anel mais justo ao emoji (tamanho do emoji só no CSS). */
  const ringSize = 108

  return (
    <section
      className="broto-home-pet-banner broto-home-pet-banner--square"
      aria-label={`${brotoNome} e indicadores de hoje`}
    >
      <div className="broto-home-pet-banner__square-inner">
        <header className="broto-home-pet-banner__block broto-home-pet-banner__block--identity">
          <p className="broto-home-pet-banner__sq-kicker">{loading ? '…' : FASE_LABEL[fase]}</p>
          <h2 className="broto-home-pet-banner__sq-name">{loading ? '…' : brotoNome}</h2>
        </header>

        {/* Desktop web (≥1040px): micro-barras espelham meta e XP sem texto editorial */}
        <div
          className="broto-home-pet-banner__block broto-home-pet-banner__block--aside-hint"
          aria-hidden
        >
          <div className="broto-home-pet-banner__micro-strip">
            <div className="broto-home-pet-banner__micro-head">
              <span className="broto-home-pet-banner__micro-label">Meta do dia</span>
              <span className="broto-home-pet-banner__micro-nums">
                {loading ? '…' : `${metaCount}/${META_QUESTOES_DIA}`}
              </span>
            </div>
            <div className="broto-home-pet-banner__micro-track">
              <span
                className="broto-home-pet-banner__micro-fill broto-home-pet-banner__micro-fill--meta"
                style={{ width: `${metaPct}%` }}
              />
            </div>
            <div className="broto-home-pet-banner__micro-head">
              <span className="broto-home-pet-banner__micro-label">XP no nível</span>
              <span className="broto-home-pet-banner__micro-nums">
                {loading ? '…' : `${xpInLevel}/100`}
              </span>
            </div>
            <div className="broto-home-pet-banner__micro-track">
              <span
                className="broto-home-pet-banner__micro-fill broto-home-pet-banner__micro-fill--xp"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="broto-home-pet-banner__block broto-home-pet-banner__block--progress">
          <div
            className="broto-home-pet-banner__ring-wrap"
            style={{ width: ringSize, height: ringSize }}
          >
            <PetXpRing pct={loading ? 0 : xpInLevel} size={ringSize} />
            <div className="broto-home-pet-banner__ring-center" aria-hidden>
              {loading ? '…' : FASE_EMOJI[fase]}
            </div>
          </div>
          <p className="broto-home-pet-banner__level-pill" aria-label={`Nível ${nivel}`}>
            {loading ? '…' : `Nv. ${nivel}`}
          </p>
          <p className="broto-home-pet-banner__ring-xp">
            {loading ? (
              '…'
            ) : (
              <>
                <span className="broto-home-pet-banner__ring-xp-values">
                  <span className="broto-home-pet-banner__ring-xp-num">{xpInLevel}</span>
                  <span className="broto-home-pet-banner__ring-xp-sep">/</span>
                  <span className="broto-home-pet-banner__ring-xp-den">100</span>
                </span>{' '}
                <span className="broto-home-pet-banner__ring-xp-unit">XP</span>
              </>
            )}
          </p>
        </div>

        <footer className="broto-home-pet-banner__block broto-home-pet-banner__block--stats">
          <div className="broto-home-pet-banner__sq-metrics">
            <div className="broto-home-pet-banner__sq-metric">
              <span className="broto-home-pet-banner__sq-metric-label">Meta hoje</span>
              <span className="broto-home-pet-banner__sq-metric-val">
                {loading ? (
                  '—'
                ) : (
                  <>
                    <span className="broto-home-pet-banner__sq-metric-num">{metaCount}</span>
                    <span className="broto-home-pet-banner__sq-metric-sep">/</span>
                    <span className="broto-home-pet-banner__sq-metric-den">{META_QUESTOES_DIA}</span>
                  </>
                )}
              </span>
            </div>
            <div className="broto-home-pet-banner__sq-metric">
              <span className="broto-home-pet-banner__sq-metric-label">Acerto hoje</span>
              <span className="broto-home-pet-banner__sq-metric-val">
                {loading ? '—' : hitPct === null ? '—' : (
                  <>
                    <span className="broto-home-pet-banner__sq-metric-num">{hitPct}</span>
                    <span className="broto-home-pet-banner__sq-metric-unit">%</span>
                  </>
                )}
              </span>
            </div>
            <div className="broto-home-pet-banner__sq-metric">
              <span className="broto-home-pet-banner__sq-metric-label">Sequência</span>
              <span className="broto-home-pet-banner__sq-metric-val">
                {loading ? '—' : (
                  <>
                    <span className="broto-home-pet-banner__sq-metric-num">{streak}</span>
                    <span className="broto-home-pet-banner__sq-metric-unit broto-home-pet-banner__sq-metric-unit--word">
                      {streak === 1 ? 'dia' : 'dias'}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  )
}
