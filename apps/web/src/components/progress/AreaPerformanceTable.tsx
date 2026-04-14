import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AreaStat } from '@/hooks/useProgress'
import { AREA_CONFIG } from '@/lib/area-config'
import { BookOpen, ChevronDown } from 'lucide-react'

type SortMode = 'priority' | 'accuracy' | 'volume'

interface AreaPerformanceTableProps {
  areas: AreaStat[]
  loading: boolean
}

export function AreaPerformanceTable({ areas, loading }: AreaPerformanceTableProps) {
  const [sort, setSort] = useState<SortMode>('priority')

  const rows = useMemo(() => {
    const copy = [...areas]
    if (sort === 'accuracy') {
      copy.sort((a, b) => {
        const wa = a.totalAnswered > 0 ? a.accuracyPct : -1
        const wb = b.totalAnswered > 0 ? b.accuracyPct : -1
        return wb - wa
      })
    } else if (sort === 'volume') {
      copy.sort((a, b) => b.totalAnswered - a.totalAnswered)
    } else {
      copy.sort((a, b) => {
        if (a.totalAnswered <= 0 && b.totalAnswered <= 0) return 0
        if (a.totalAnswered <= 0) return 1
        if (b.totalAnswered <= 0) return -1
        return a.accuracyPct - b.accuracyPct
      })
    }
    return copy
  }, [areas, sort])

  return (
    <section
      id="progress-areas"
      className="broto-perf-section broto-progress-area-section"
      aria-labelledby="progress-areas-title"
    >
      <div className="broto-perf-external-head">
        <div className="broto-section-heading-row">
          <h2 id="progress-areas-title" className="broto-perf-card__title">
            Desempenho por área
          </h2>
        </div>
        <label className="broto-progress-table-sort">
          <span className="broto-sr-only">Ordenar por</span>
          <span className="broto-progress-table-sort__label">Ordenar</span>
          <div className="broto-progress-table-sort__wrap">
            <select
              className="broto-progress-table-sort__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
            >
              <option value="priority">Precisa melhorar</option>
              <option value="accuracy">Maior acerto</option>
              <option value="volume">Mais questões</option>
            </select>
            <ChevronDown size={14} className="broto-progress-table-sort__chev" aria-hidden />
          </div>
        </label>
      </div>

      <div className="broto-perf-card">
        <div className="broto-progress-area-table-wrap" role="region" aria-label="Tabela de áreas">
        <table className="broto-progress-area-table">
          <thead>
            <tr>
              <th scope="col">Área</th>
              <th scope="col">Acerto</th>
              <th scope="col">Questões</th>
              <th scope="col" className="broto-progress-area-table__col-bar">
                Distribuição
              </th>
              <th scope="col" className="broto-progress-area-table__col-cta" />
            </tr>
          </thead>
          <tbody>
            {rows.map((area) => {
              const config = AREA_CONFIG[area.value] ?? {
                color: '#888',
                icon: BookOpen,
                label: area.label,
              }
              const Icon = config.icon
              const hasData = !loading && area.totalAnswered > 0
              const pct = hasData ? area.accuracyPct : 0
              return (
                <tr key={area.value}>
                  <td>
                    <div className="broto-progress-area-table__name">
                      <span
                        className="broto-prog-area-icon-wrap"
                        style={{
                          background: `${config.color}18`,
                          border: `1px solid ${config.color}33`,
                        }}
                      >
                        <Icon size={16} style={{ color: config.color }} aria-hidden />
                      </span>
                      <span>{area.label}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="broto-progress-area-table__pct"
                      style={{ color: hasData ? config.color : 'var(--text-muted)' }}
                    >
                      {loading ? '—' : hasData ? `${pct}%` : '—'}
                    </span>
                  </td>
                  <td>
                    <span className="broto-progress-area-table__n">
                      {loading ? '—' : area.totalAnswered.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="broto-progress-area-table__col-bar">
                    <div className="broto-prog-area-bar broto-prog-area-bar--thick">
                      <div
                        className="broto-prog-area-bar-fill"
                        style={{
                          width: hasData ? `${pct}%` : '4%',
                          background: hasData ? config.color : 'var(--border-subtle)',
                          opacity: hasData ? 1 : 0.5,
                        }}
                      />
                    </div>
                  </td>
                  <td className="broto-progress-area-table__col-cta">
                    <Link
                      to={`/study/${area.value}?hub=bank`}
                      className="broto-progress-area-table__link"
                    >
                      Praticar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  )
}
