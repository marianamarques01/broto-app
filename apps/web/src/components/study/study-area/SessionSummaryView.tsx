import { CheckCircle2, RotateCcw, Trophy, Zap } from 'lucide-react'
import { STUDY_JOURNEY_STAGES, brotoCelebrateLine } from '@broto/shared'
import type { StudyPackage } from '@/lib/study-area-mock'
import type { StudyAreaTab } from '@/components/study/study-area/study-area-utils'

export function SessionSummaryView({
  pkg,
  questionsCorrect,
  questionsTotal,
  flashcardsCount,
  areaColor,
  onBack,
  completed,
}: {
  pkg: StudyPackage
  questionsCorrect: number
  questionsTotal: number
  flashcardsCount: number
  areaColor: string
  onBack: () => void
  completed: Record<StudyAreaTab, boolean>
}) {
  const xp = 50 + questionsCorrect * 10
  const trailHuman = STUDY_JOURNEY_STAGES.filter((s) => completed[s.tab])
    .map((s) => s.title)
    .join(' → ')
  const lastDoneTab = [...STUDY_JOURNEY_STAGES].reverse().find((s) => completed[s.tab])?.tab
  const brotoClose = lastDoneTab
    ? brotoCelebrateLine(lastDoneTab)
    : 'Orgulho do Broto: você chegou até aqui com calma.'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: `linear-gradient(135deg, ${areaColor}20, var(--gold-glow))`,
          border: `2px solid ${areaColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Trophy size={36} color="var(--gold-400)" />
      </div>

      <h2
        style={{
          margin: '0 0 8px',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Sessao concluida!
      </h2>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Você completou a trilha de <strong style={{ color: areaColor }}>{pkg.topicoLabel}</strong>
      </p>
      <p
        style={{
          margin: '14px 0 0',
          fontSize: '0.88rem',
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          maxWidth: 420,
        }}
      >
        {brotoClose}
      </p>
      {trailHuman ? (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          Etapas: {trailHuman}
        </p>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          marginTop: 28,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {[
          {
            label: 'XP Ganho',
            value: `+${xp}`,
            icon: <Zap size={18} color="var(--gold-400)" />,
            color: 'var(--gold-glow)',
          },
          {
            label: 'Quiz',
            value: `${questionsCorrect}/${questionsTotal}`,
            icon: <CheckCircle2 size={18} color="var(--green-400)" />,
            color: 'var(--green-glow)',
          },
          {
            label: 'Flashcards',
            value: `${flashcardsCount}`,
            icon: <RotateCcw size={18} color={areaColor} />,
            color: `${areaColor}15`,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '18px 12px',
              borderRadius: 'var(--radius-md)',
              background: s.color,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {s.icon}
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {s.value}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          width: '100%',
          maxWidth: 420,
          textAlign: 'left',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          Proximo passo sugerido
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          Continue praticando <strong>questoes do ENEM</strong> sobre {pkg.topicoLabel} para
          reforcar o aprendizado.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, width: '100%', maxWidth: 420 }}>
        <button
          type="button"
          onClick={onBack}
          className="broto-btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Estudar outro topico
        </button>
      </div>
    </div>
  )
}
