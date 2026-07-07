import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, Loader2 } from 'lucide-react'
import {
  REDACAO_DIFICULDADE_LABELS,
  REDACAO_EIXO_LABELS,
  REDACAO_EIXOS_TEMATICOS,
  type RedacaoEixoTematico,
} from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { useRedacaoTemas } from '@/hooks/useRedacaoTemas'
import { getRedacaoEixoColor, getRedacaoEixoIcon } from '@/lib/redacao-eixo-ui'

export function RedacaoListPage() {
  const [eixoFilter, setEixoFilter] = useState<RedacaoEixoTematico | undefined>(undefined)
  const { temas, loading, error } = useRedacaoTemas(eixoFilter)

  return (
    <div className="broto-page broto-page--redacao">
      <TopBar title="Redação ENEM" subtitle="Escolha um tema e pratique no formato da prova" />

      <div className="broto-main-inner broto-main-inner--redacao-list">
        <section className="broto-redacao-intro" aria-labelledby="redacao-intro-title">
          <div className="broto-redacao-intro__icon" aria-hidden>
            <PenLine size={22} strokeWidth={2} />
          </div>
          <div>
            <h2 id="redacao-intro-title" className="broto-redacao-intro__title">
              Treino dissertativo-argumentativo
            </h2>
            <p className="broto-redacao-intro__text">
              Escreva entre 7 e 30 linhas, consulte repertórios do professor e receba correção com
              feedback por competência.
            </p>
          </div>
        </section>

        <div className="broto-redacao-filters" role="group" aria-label="Filtrar por eixo temático">
          <button
            type="button"
            className={`broto-redacao-filter${eixoFilter === undefined ? ' broto-redacao-filter--active' : ''}`}
            onClick={() => setEixoFilter(undefined)}
          >
            Todos
          </button>
          {REDACAO_EIXOS_TEMATICOS.map((eixo) => {
            const EixoIcon = getRedacaoEixoIcon(eixo)
            const isActive = eixoFilter === eixo
            const eixoColor = getRedacaoEixoColor(eixo)

            return (
              <button
                key={eixo}
                type="button"
                className={`broto-redacao-filter${isActive ? ' broto-redacao-filter--active' : ''}`}
                data-eixo={eixo}
                style={
                  isActive
                    ? ({
                        '--eixo-color': eixoColor,
                      } as CSSProperties)
                    : undefined
                }
                onClick={() => setEixoFilter(eixo)}
              >
                <EixoIcon size={14} strokeWidth={2} aria-hidden />
                {REDACAO_EIXO_LABELS[eixo]}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="broto-redacao-state" role="status">
            <Loader2 className="broto-redacao-state__spin" size={24} aria-hidden />
            <span>Carregando temas…</span>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="broto-redacao-state broto-redacao-state--error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && temas.length === 0 ? (
          <div className="broto-redacao-state">
            <p>Nenhum tema disponível no momento.</p>
          </div>
        ) : null}

        {!loading && !error && temas.length > 0 ? (
          <ul className="broto-redacao-tema-grid">
            {temas.map((tema) => {
              const EixoIcon = getRedacaoEixoIcon(tema.eixo_tematico)
              const eixoColor = getRedacaoEixoColor(tema.eixo_tematico)

              return (
                <li key={tema.id}>
                  <Link
                    to={`/redacao/tema/${tema.id}`}
                    className="broto-redacao-tema-card"
                    data-eixo={tema.eixo_tematico}
                    style={{ '--eixo-color': eixoColor } as CSSProperties}
                  >
                    <span className="broto-redacao-tema-card__eixo">
                      <EixoIcon size={14} strokeWidth={2} aria-hidden />
                      {REDACAO_EIXO_LABELS[tema.eixo_tematico]}
                    </span>
                    <h3 className="broto-redacao-tema-card__title">{tema.titulo}</h3>
                    <p className="broto-redacao-tema-card__meta">
                      Dificuldade: {REDACAO_DIFICULDADE_LABELS[tema.dificuldade]}
                      {tema.organization_id ? ' · Tema da escola' : ' · Tema Broto'}
                    </p>
                    <span className="broto-redacao-tema-card__cta">Escrever redação</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
