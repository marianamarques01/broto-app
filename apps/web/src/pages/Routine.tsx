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
  const diaHoje = useMemo(() => rotina.find(d => d.ehHoje), [rotina])
  const proximosDias = useMemo(() => rotina.filter(d => !d.ehHoje && !d.ehPassado), [rotina])

  const semanaLabel = useMemo(
    () => formatarSemana(getSegundaDaSemana(new Date())),
    [],
  )

  return (
    <div>
      <TopBar title="Rotina" />

      <div className="broto-main-inner">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {loading ? '...' : semanaLabel}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--green-glow)',
            color: 'var(--green-400)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {proximosDias.map(dia => {
                    const Icon = dia.area ? getAreaIcon(dia.area.value) : BookOpen
                    const color = dia.area ? getAreaColor(dia.area.value) : 'var(--text-muted)'

                    return (
                      <div
                        key={dia.idx}
                        className="broto-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                        }}
                      >
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: dia.ehDescanso ? 'var(--bg-deep)' : `${color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {dia.label}
                          </div>
                          <div style={{ fontSize: '0.78rem', marginTop: 3, color: 'var(--text-muted)' }}>
                            {dia.ehDescanso ? 'Descanso' : `${dia.area?.label} · ${Math.floor(dia.duracaoMin / 60)} h`}
                          </div>
                        </div>
                        {!dia.ehDescanso && dia.area && dia.area.totalAnswered > 0 && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
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
