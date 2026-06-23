import { pKnowTone, type ClassAreaStat } from '@broto/shared'

const TONE_COLOR: Record<ReturnType<typeof pKnowTone>, string> = {
  good: 'var(--green-600)',
  mid: 'var(--gold-600)',
  low: 'var(--red-400)',
}

const TONE_BAR: Record<ReturnType<typeof pKnowTone>, string> = {
  good: 'var(--green-500)',
  mid: 'var(--gold-500)',
  low: 'var(--red-500)',
}

type Props = {
  areaStats: ClassAreaStat[]
  loading: boolean
  studentCount: number
}

export function ClassDomainByArea({ areaStats, loading, studentCount }: Props) {
  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando domínio por área…</p>
  }

  if (studentCount === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Nenhum aluno matriculado ainda. Compartilhe o código da turma para começar.
      </p>
    )
  }

  if (areaStats.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Ainda não há dados de domínio (p_know) para esta turma. Os alunos precisam responder
        questões para gerar métricas.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Domínio por área</h2>
      {areaStats.map((area) => {
        const tone = pKnowTone(area.avgPKnow)
        const pct = Math.round(area.avgPKnow * 100)
        return (
          <div key={area.area} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{area.label}</span>
              <span style={{ color: TONE_COLOR[tone], fontWeight: 500 }}>{pct}% domínio médio</span>
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--bg-deep)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${area.label}: ${pct}% domínio médio`}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: TONE_BAR[tone],
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              {area.studentCount} aluno{area.studentCount !== 1 ? 's' : ''} com dados nesta área
            </p>
          </div>
        )
      })}
    </div>
  )
}
