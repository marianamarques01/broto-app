import { useCallback, useMemo, useState } from 'react'
import type { PetData } from '@broto/shared'
import { FASE_EMOJI, FASE_LABEL } from '@/hooks/usePet'
import { Gift } from 'lucide-react'

const META_QUESTOES_DIA = 3
const STREAK_WEEK_GOAL = 7

const FASE_ORDER: PetData['fase'][] = ['semente', 'muda', 'planta', 'flor', 'especial']

function daysSinceLastLocalStudy(
  dayMap: Readonly<Record<string, { answered: number }>>,
  todayISO: string,
): number | null {
  const dates = Object.keys(dayMap)
    .filter((k) => dayMap[k].answered > 0)
    .sort()
  if (!dates.length) return null
  const last = dates[dates.length - 1]
  const t0 = new Date(`${last}T12:00:00`).getTime()
  const t1 = new Date(`${todayISO}T12:00:00`).getTime()
  if (Number.isNaN(t0) || Number.isNaN(t1)) return null
  return Math.max(0, Math.floor((t1 - t0) / 86400000))
}

function todayLocalISO(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getEmotionalLayer(input: {
  streak: number
  questoesHoje: number
  totalAnswered: number
  accuracyPct: number
  hasData: boolean
  daysSince: number | null
  metaMet: boolean
}): { moodLabel: string; moodEmoji: string; voiceLine: string } {
  const { streak, questoesHoje, totalAnswered, accuracyPct, hasData, daysSince, metaMet } = input

  if (daysSince !== null && daysSince >= 2 && hasData) {
    return {
      moodLabel: 'Com saudades',
      moodEmoji: '\u{1F972}',
      voiceLine:
        daysSince >= 4
          ? 'Faz um tempinho que a gente não estuda juntos… Posso contar com você hoje?'
          : 'Senti sua falta! Que tal voltarmos com uma rodada leve?',
    }
  }

  if (metaMet && questoesHoje > 0) {
    return {
      moodLabel: 'Radiante',
      moodEmoji: '\u2728',
      voiceLine: 'Meta do dia no bolso! Esse cuidado diário me fortalece.',
    }
  }

  if (streak >= 7) {
    return {
      moodLabel: 'Imparável',
      moodEmoji: '\u{1F525}',
      voiceLine: `${streak} dias seguidos — estou evoluindo visível, e é mérito seu.`,
    }
  }

  if (streak >= 3) {
    return {
      moodLabel: 'Feliz',
      moodEmoji: '\u{1F60A}',
      voiceLine: `${streak} dias seguidos! Estou crescendo forte.`,
    }
  }

  if (!hasData && totalAnswered === 0) {
    return {
      moodLabel: 'Curioso',
      moodEmoji: '\u{1F440}',
      voiceLine: 'Oi! Quando você começar a praticar, nossa jornada ganha cor.',
    }
  }

  if (accuracyPct >= 78 && totalAnswered >= 12) {
    return {
      moodLabel: 'Confiante',
      moodEmoji: '\u{1F4AA}',
      voiceLine: 'Seu ritmo de acerto me dá energia — vamos manter com leveza.',
    }
  }

  if (streak === 0 && questoesHoje === 0 && hasData) {
    return {
      moodLabel: 'Esperançoso',
      moodEmoji: '\u{1F31F}',
      voiceLine: 'Novo dia, novo broto: um passinho já reacende a sequência.',
    }
  }

  return {
    moodLabel: 'Tranquilo',
    moodEmoji: '\u{1F33A}',
    voiceLine: 'Estou aqui, crescendo no seu ritmo — um pouquinho por dia já muda tudo.',
  }
}

export interface BrotoHeroCardProps {
  pet: PetData | null
  loadingPet: boolean
  accuracyPct: number
  totalAnswered: number
  hasData: boolean
  performanceDayMap: Readonly<Record<string, { answered: number; correct: number }>>
}

export function BrotoHeroCard({
  pet,
  loadingPet,
  accuracyPct,
  totalAnswered,
  hasData,
  performanceDayMap,
}: BrotoHeroCardProps) {
  const [rewardBurst, setRewardBurst] = useState(false)

  const fase = pet?.fase ?? 'semente'
  const brotoNome = pet?.nome?.trim() || 'Broto'
  const nivel = pet?.nivel ?? 1
  const xp = pet?.xp ?? 0
  const xpInLevel = xp % 100
  const streak = pet?.streak ?? 0
  const questoesHoje = pet?.questoesHoje ?? 0

  const metaMet = questoesHoje >= META_QUESTOES_DIA
  const todayISO = useMemo(() => todayLocalISO(), [])
  const daysSince = useMemo(
    () => daysSinceLastLocalStudy(performanceDayMap, todayISO),
    [performanceDayMap, todayISO],
  )

  const emotional = useMemo(
    () =>
      getEmotionalLayer({
        streak,
        questoesHoje,
        totalAnswered,
        accuracyPct,
        hasData,
        daysSince,
        metaMet,
      }),
    [streak, questoesHoje, totalAnswered, accuracyPct, hasData, daysSince, metaMet],
  )

  const phaseIndex = Math.max(0, FASE_ORDER.indexOf(fase))
  const streakWeekFill = Math.min(100, (Math.min(streak, STREAK_WEEK_GOAL) / STREAK_WEEK_GOAL) * 100)

  const handleRewardClick = useCallback(() => {
    if (!metaMet || loadingPet) return
    setRewardBurst(true)
    window.setTimeout(() => setRewardBurst(false), 1400)
  }, [metaMet, loadingPet])

  return (
    <section
      className={`broto-hero-card${rewardBurst ? ' broto-hero-card--burst' : ''}${metaMet ? ' broto-hero-card--meta-met' : ''}`}
      aria-label={`${brotoNome} e evolução`}
    >
      <div className="broto-hero-card__ambient" aria-hidden />

      <div className="broto-hero-card__layout">
        <div className="broto-hero-card__identity">
          <div className="broto-hero-card__avatar-ring">
            <div className="broto-hero-card__avatar-core">
              <span className="broto-hero-card__avatar-emoji" aria-hidden>
                {loadingPet ? '…' : FASE_EMOJI[fase]}
              </span>
            </div>
          </div>
        </div>

        <div className="broto-hero-card__body">
          <header className="broto-hero-card__masthead">
            <p className="broto-hero-card__eyebrow">{loadingPet ? '…' : brotoNome}</p>
            <div className="broto-hero-card__masthead-row">
              <h2 className="broto-hero-card__phase-title">
                {loadingPet ? '…' : FASE_LABEL[fase]}
                <span className="broto-hero-card__level-sep" aria-hidden>
                  ·
                </span>
                <span className="broto-hero-card__level-num">
                  nv. {loadingPet ? '…' : nivel}
                </span>
              </h2>
              <span className="broto-hero-card__mood-chip" title={emotional.moodLabel}>
                <span className="broto-hero-card__mood-chip-emoji" aria-hidden>
                  {emotional.moodEmoji}
                </span>
                <span className="broto-hero-card__mood-chip-label">{emotional.moodLabel}</span>
              </span>
            </div>
            <p className="broto-hero-card__voice">
              {loadingPet ? 'Carregando seu Broto…' : emotional.voiceLine}
            </p>
          </header>

          <div className="broto-hero-card__growth" aria-label="Trilha de evolução">
            <div className="broto-hero-card__growth-head">
              <span className="broto-hero-card__growth-title">Caminho de evolução</span>
              <span className="broto-hero-card__growth-hint">
                {loadingPet ? '…' : `${FASE_LABEL[fase]} é a fase atual`}
              </span>
            </div>
            <div className="broto-hero-card__evo-track">
              {FASE_ORDER.map((step, i) => {
                const done = i < phaseIndex
                const current = i === phaseIndex
                return (
                  <div key={step} className="broto-hero-card__evo-step">
                    <div className="broto-hero-card__evo-step-head">
                      {i > 0 ? (
                        <div
                          className={`broto-hero-card__evo-connector${i <= phaseIndex ? ' broto-hero-card__evo-connector--lit' : ''}`}
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={`broto-hero-card__evo-node${current ? ' broto-hero-card__evo-node--current' : ''}${done ? ' broto-hero-card__evo-node--done' : ''}`}
                      >
                        <span className="broto-hero-card__evo-emoji" aria-hidden>
                          {loadingPet ? '·' : FASE_EMOJI[step]}
                        </span>
                      </div>
                    </div>
                    <span className="broto-hero-card__evo-label">{FASE_LABEL[step]}</span>
                  </div>
                )
              })}
            </div>

            <div className="broto-hero-card__progress-panel">
              <div className="broto-hero-card__progress-block">
                <div className="broto-hero-card__progress-head">
                  <span className="broto-hero-card__progress-label">XP neste nível</span>
                  <span className="broto-hero-card__progress-value">
                    {loadingPet ? '—' : `${xpInLevel} / 100`}
                  </span>
                </div>
                <div
                  className="broto-hero-card__bar broto-hero-card__bar--xp"
                  role="progressbar"
                  aria-valuenow={loadingPet ? 0 : xpInLevel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="broto-hero-card__bar-fill"
                    style={{ width: `${loadingPet ? 0 : xpInLevel}%` }}
                  />
                </div>
              </div>
              <div className="broto-hero-card__progress-block">
                <div className="broto-hero-card__progress-head">
                  <span className="broto-hero-card__progress-label">Meta semanal de sequência</span>
                  <span className="broto-hero-card__progress-value">
                    {loadingPet
                      ? '—'
                      : `${Math.min(streak, STREAK_WEEK_GOAL)} / ${STREAK_WEEK_GOAL} dias`}
                  </span>
                </div>
                <div
                  className="broto-hero-card__bar broto-hero-card__bar--streak"
                  role="progressbar"
                  aria-valuenow={loadingPet ? 0 : Math.min(streak, STREAK_WEEK_GOAL)}
                  aria-valuemin={0}
                  aria-valuemax={STREAK_WEEK_GOAL}
                >
                  <div
                    className="broto-hero-card__bar-fill"
                    style={{ width: `${loadingPet ? 0 : streakWeekFill}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="broto-hero-card__reward">
        <div className="broto-hero-card__reward-icon" aria-hidden>
          <Gift size={18} strokeWidth={2} />
        </div>
        <div className="broto-hero-card__reward-copy">
          <p className="broto-hero-card__reward-title">Recompensa do dia</p>
          <p className="broto-hero-card__reward-sub">
            {metaMet
              ? 'Meta concluída — toque para celebrar com o Broto.'
              : `Faltam ${Math.max(0, META_QUESTOES_DIA - questoesHoje)} de ${META_QUESTOES_DIA} questões hoje.`}
          </p>
        </div>
        <button
          type="button"
          className="broto-hero-card__reward-cta"
          disabled={!metaMet || loadingPet}
          onClick={handleRewardClick}
        >
          Resgatar
        </button>
      </footer>
    </section>
  )
}
