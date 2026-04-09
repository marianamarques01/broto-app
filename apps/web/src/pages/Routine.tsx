import { useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { WeekStrip } from '@/components/routine/WeekStrip'
import { DayCard } from '@/components/routine/DayCard'
import { useUser } from '@/hooks/useUser'
import { useProgress } from '@/hooks/useProgress'
import { BookOpen, Clock } from 'lucide-react'
import { getAreaColor, getAreaIcon } from '@/lib/area-config'
import { gerarRotina, getSegundaDaSemana, formatarSemana } from '@/lib/routine'

export function Routine() {
  const { user, loading: loadingUser } = useUser()
  const { progress, loading: loadingProgress } = useProgress()

  const loading = loadingUser || loadingProgress
  const horasPorDia = user?.horasDisponiveisPorDia ?? 2
  const areas = progress?.areas ?? []

  const rotina = useMemo(
    () => (!loading ? gerarRotina(areas, horasPorDia) : []),
    [loading, areas, horasPorDia],
  )
  const diaHoje = useMemo(() => rotina.find((d) => d.ehHoje), [rotina])
  const proximosDias = useMemo(() => rotina.filter((d) => !d.ehHoje && !d.ehPassado), [rotina])

  const semanaLabel = useMemo(() => formatarSemana(getSegundaDaSemana(new Date())), [])

  return (
    <div>
      <TopBar title="Rotina" subtitle="Seu plano de estudos semanal" />

        <div className="broto-main-inner">
        <p
          className="broto-muted"
          style={{
            fontSize: '0.88rem',
            lineHeight: 1.5,
            margin: '0 0 18px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Seu cronograma é gerado automaticamente neste aparelho: priorizamos áreas com menor taxa de
          acerto (com base no que já foi respondido) e respeitamos suas horas de estudo por dia. Não é
          um plano salvo no servidor — ao evoluir o produto, poderemos vincular a uma rotina
          personalizada persistente ou sugerida pela IA.
        </p>

        <div className="broto-routine-meta">
          <span className="broto-routine-meta__week">
            {loading ? '...' : semanaLabel}
          </span>
          <span className="broto-routine-meta__hours">
            <Clock size={12} />
            {horasPorDia} h/dia
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="broto-skeleton" style={{ height: 100 }} />
            <div className="broto-skeleton" style={{ height: 200 }} />
          </div>
        ) : (
          <>
            <div className="broto-fade-in">
              <WeekStrip rotina={rotina} />
            </div>

            <div className="broto-fade-in broto-fade-in-delay-1" style={{ marginTop: 22 }}>
              {diaHoje && <DayCard dia={diaHoje} />}
            </div>

            {proximosDias.length > 0 && (
              <div className="broto-fade-in broto-fade-in-delay-2" style={{ marginTop: 28 }}>
                <h3 className="broto-section-label">Próximos dias</h3>
                <div className="broto-routine-upcoming">
                  {proximosDias.map((dia) => {
                    const Icon = dia.area ? getAreaIcon(dia.area.value) : BookOpen
                    const color = dia.area ? getAreaColor(dia.area.value) : 'var(--text-muted)'

                    return (
                      <div key={dia.idx} className="broto-routine-day">
                        <div
                          className="broto-routine-day__icon"
                          style={{
                            background: dia.ehDescanso ? 'var(--bg-deep)' : `${color}18`,
                          }}
                        >
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div className="broto-routine-day__info">
                          <div className="broto-routine-day__title">{dia.label}</div>
                          <div className="broto-routine-day__detail">
                            {dia.ehDescanso
                              ? 'Descanso'
                              : `${dia.area?.label} · ${Math.floor(dia.duracaoMin / 60)} h`}
                          </div>
                        </div>
                        {!dia.ehDescanso && dia.area && dia.area.totalAnswered > 0 && (
                          <span className="broto-routine-day__accuracy" style={{ color }}>
                            {dia.area.accuracyPct}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
