import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, PenLine, Target, TrendingUp } from 'lucide-react'
import {
  REDACAO_EIXO_LABELS,
  computeMetaProgress,
} from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { RedacaoEvolucaoChart } from '@/components/redacao/RedacaoEvolucaoChart'
import { useRedacaoEvolucao } from '@/hooks/useRedacaoEvolucao'

function formatNivelRedacao(nivel: string | null | undefined): string | null {
  if (!nivel?.trim()) return null
  return nivel.replace(/_/g, ' ')
}

export function RedacaoEvolucaoPage() {
  const { data, loading, error, reload } = useRedacaoEvolucao()

  const latestTotal = data?.historico[0]?.nota_total ?? null
  const metaProgress = computeMetaProgress(data?.meta_redacao, latestTotal)
  const nivelLabel = formatNivelRedacao(data?.nivel_redacao)

  return (
    <div className="broto-page broto-page--redacao broto-page--redacao-evolucao">
      <TopBar
        title="Evolução em redação"
        subtitle="Acompanhe seu progresso por competência ao longo do tempo"
      />

      <div className="broto-main-inner broto-main-inner--redacao-evolucao">
        <Link to="/redacao" className="broto-redacao-back-link">
          <ArrowLeft size={16} aria-hidden />
          Voltar aos temas
        </Link>

        {loading && !data ? (
          <div className="broto-redacao-state" role="status">
            <Loader2 className="broto-redacao-state__spin" size={24} aria-hidden />
            <span>Carregando evolução…</span>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="broto-redacao-state broto-redacao-state--error" role="alert">
            {error}
            <button type="button" className="broto-rx-result-retry" onClick={() => void reload()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {data ? (
          <>
            <section className="broto-rx-evolucao-summary" aria-labelledby="redacao-evolucao-resumo">
              <div className="broto-rx-evolucao-summary__icon" aria-hidden>
                <TrendingUp size={22} strokeWidth={2} />
              </div>
              <div>
                <h2 id="redacao-evolucao-resumo" className="broto-rx-evolucao-summary__title">
                  {data.total_redacoes === 0
                    ? 'Comece sua jornada de redação'
                    : `${data.total_redacoes} redação${data.total_redacoes === 1 ? '' : 'ões'} corrigida${data.total_redacoes === 1 ? '' : 's'}`}
                </h2>
                <p className="broto-rx-evolucao-summary__text">
                  {nivelLabel ? `Nível declarado: ${nivelLabel}. ` : ''}
                  {metaProgress.meta != null
                    ? `Meta de nota: ${metaProgress.meta} pontos.`
                    : 'Defina uma meta de redação no perfil para acompanhar seu progresso.'}
                </p>
                {metaProgress.progressPct != null ? (
                  <div className="broto-rx-evolucao-meta">
                    <div className="broto-rx-evolucao-meta__bar" role="progressbar" aria-valuenow={metaProgress.progressPct} aria-valuemin={0} aria-valuemax={100}>
                      <span
                        className="broto-rx-evolucao-meta__fill"
                        style={{ width: `${metaProgress.progressPct}%` }}
                      />
                    </div>
                    <p className="broto-rx-evolucao-meta__label">
                      {latestTotal} / {metaProgress.meta} pts
                      {metaProgress.faltam != null && metaProgress.faltam > 0
                        ? ` · faltam ${metaProgress.faltam}`
                        : ''}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <RedacaoEvolucaoChart series={data.series} />

            {data.weak_competences.length > 0 ? (
              <section
                className="broto-rx-evolucao-weak"
                aria-labelledby="redacao-evolucao-weak-title"
              >
                <h2 id="redacao-evolucao-weak-title" className="broto-rx-evolucao-section-title">
                  <Target size={18} aria-hidden />
                  Competências para reforçar
                </h2>
                <p className="broto-rx-evolucao-weak__intro">
                  Média abaixo de 120 nas últimas 3 redações — a rotina de estudo vai priorizar
                  conteúdo relacionado.
                </p>
                <ul className="broto-rx-evolucao-weak__list">
                  {data.recomendacoes.map((hint) => (
                    <li key={hint.competencia} className="broto-rx-evolucao-weak__item">
                      <span className="broto-rx-evolucao-weak__comp">
                        Comp. {hint.competencia}
                      </span>
                      <span>{hint.label}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/routine" className="broto-rx-evolucao-weak__cta">
                  Ver rotina de estudo
                </Link>
              </section>
            ) : null}

            {data.historico.length > 0 ? (
              <section
                className="broto-rx-evolucao-history"
                aria-labelledby="redacao-evolucao-history-title"
              >
                <h2 id="redacao-evolucao-history-title" className="broto-rx-evolucao-section-title">
                  Histórico recente
                </h2>
                <ul className="broto-rx-evolucao-history__list">
                  {data.historico.map((item) => (
                    <li key={item.redacao_id}>
                      <Link
                        to={`/redacao/resultado/${item.redacao_id}`}
                        className="broto-rx-evolucao-history__card"
                      >
                        <div>
                          <h3 className="broto-rx-evolucao-history__title">{item.tema_titulo}</h3>
                          <p className="broto-rx-evolucao-history__meta">
                            {REDACAO_EIXO_LABELS[item.eixo_tematico]} ·{' '}
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="broto-rx-evolucao-history__score">{item.nota_total}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="broto-rx-evolucao-empty">
                <PenLine size={28} aria-hidden />
                <p>Escreva sua primeira redação para começar a ver evolução.</p>
                <Link to="/redacao" className="broto-rx-evolucao-empty__cta">
                  Escolher tema
                </Link>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
