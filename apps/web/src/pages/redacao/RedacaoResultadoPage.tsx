import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  PenLine,
  RefreshCw,
  Target,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import {
  REDACAO_COMPETENCIAS,
  REDACAO_COMPETENCIA_SHORT,
  findWeakestCompetencia,
  formatFatorZeroMotivos,
  getJustificativaCompetencia,
  getNotaCompetencia,
  pickTemaParaPratica,
  type RedacaoCompetencia,
  type RedacaoRepertorio,
} from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { CompetenciaNotaCard } from '@/components/redacao/CompetenciaNotaCard'
import { RedacaoTextoMarcado } from '@/components/redacao/RedacaoTextoMarcado'
import { useRedacaoRepertorios } from '@/hooks/useRedacaoRepertorios'
import { useRedacaoResultado } from '@/hooks/useRedacaoResultado'
import { useRedacaoTemas } from '@/hooks/useRedacaoTemas'

function scoreTier(notaTotal: number): { label: string; className: string } {
  if (notaTotal >= 800)
    return { label: 'Excelente!', className: 'broto-rx-result-hero__tier--high' }
  if (notaTotal >= 600)
    return { label: 'Bom caminho!', className: 'broto-rx-result-hero__tier--mid' }
  if (notaTotal >= 400)
    return { label: 'Há espaço para evoluir', className: 'broto-rx-result-hero__tier--ok' }
  return { label: 'Continue praticando', className: 'broto-rx-result-hero__tier--low' }
}

function filterRepertoriosSugeridos(
  repertorios: RedacaoRepertorio[],
  competencia: RedacaoCompetencia,
): RedacaoRepertorio[] {
  return repertorios
    .filter((r) => r.competencia_alvo === competencia || r.competencia_alvo === null)
    .slice(0, 4)
}

export function RedacaoResultadoPage() {
  const navigate = useNavigate()
  const { redacaoId } = useParams<{ redacaoId: string }>()
  const { data, loading, error, reload } = useRedacaoResultado(redacaoId)
  const { temas } = useRedacaoTemas()

  const correcao = data?.correcao ?? null
  const tema = data?.tema
  const redacao = data?.redacao

  const weakest = useMemo(() => (correcao ? findWeakestCompetencia(correcao) : null), [correcao])

  const { repertorios, loading: loadingRepertorios } = useRedacaoRepertorios({
    eixoTematico: tema?.eixo_tematico ?? null,
    competenciaAlvo: weakest,
  })

  const repertoriosSugeridos = useMemo(
    () => (weakest ? filterRepertoriosSugeridos(repertorios, weakest) : []),
    [repertorios, weakest],
  )

  const [expandedComp, setExpandedComp] = useState<RedacaoCompetencia | null>(null)

  const toggleComp = useCallback((comp: RedacaoCompetencia) => {
    setExpandedComp((current) => (current === comp ? null : comp))
  }, [])

  const handleReescrever = useCallback(() => {
    if (!tema) return
    navigate(`/redacao/tema/${tema.id}`)
  }, [navigate, tema])

  const handlePraticarFraca = useCallback(() => {
    if (!tema) return
    const picked = pickTemaParaPratica(temas, tema.id, tema.eixo_tematico)
    if (picked) {
      navigate(`/redacao/tema/${picked.id}`)
      return
    }
    navigate('/redacao')
  }, [navigate, tema, temas])

  const isPending =
    redacao && !correcao && (redacao.status === 'enviada' || redacao.status === 'corrigindo')
  const tier = correcao ? scoreTier(correcao.nota_total) : null

  return (
    <div className="broto-page broto-page--redacao broto-page--redacao-resultado">
      <TopBar title="Resultado da redação" subtitle={tema?.titulo ?? 'Feedback da correção'} />

      <div className="broto-main-inner broto-main-inner--redacao-resultado">
        <Link to="/redacao" className="broto-redacao-back-link">
          <ArrowLeft size={16} aria-hidden />
          Voltar aos temas
        </Link>

        {loading && !data ? (
          <div className="broto-redacao-state" role="status">
            <Loader2 className="broto-redacao-state__spin" size={24} aria-hidden />
            <span>Carregando resultado…</span>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="broto-redacao-state broto-redacao-state--error" role="alert">
            {error}
            <button type="button" className="broto-rx-result-retry" onClick={() => void reload()}>
              <RefreshCw size={16} aria-hidden />
              Tentar novamente
            </button>
          </div>
        ) : null}

        {redacao?.status === 'erro' ? (
          <div className="broto-rx-zero-banner broto-rx-zero-banner--error" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>Não foi possível corrigir esta redação.</strong>
              <p>Tente reenviar pelo editor ou volte mais tarde.</p>
            </div>
            {tema ? (
              <button
                type="button"
                className="broto-rx-result-cta broto-rx-result-cta--ghost"
                onClick={handleReescrever}
              >
                Abrir editor
              </button>
            ) : null}
          </div>
        ) : null}

        {isPending && redacao?.status !== 'erro' ? (
          <div className="broto-redacao-state" role="status">
            <Loader2 className="broto-redacao-state__spin" size={24} aria-hidden />
            <span>Correção em andamento… isso pode levar até um minuto.</span>
          </div>
        ) : null}

        {correcao && redacao ? (
          <>
            {correcao.fatores_zero.detectado ? (
              <div className="broto-rx-zero-banner" role="alert">
                <AlertTriangle size={20} aria-hidden />
                <div>
                  <strong>Fator de nota zero detectado</strong>
                  <p>{formatFatorZeroMotivos(correcao.fatores_zero.motivos)}</p>
                  {correcao.fatores_zero.detalhes ? (
                    <p className="broto-rx-zero-banner__detail">{correcao.fatores_zero.detalhes}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <section className="broto-rx-result-hero" aria-labelledby="redacao-nota-total">
              <div className="broto-rx-result-hero__score-ring">
                <span className="broto-rx-result-hero__score-value" id="redacao-nota-total">
                  {correcao.nota_total}
                </span>
                <span className="broto-rx-result-hero__score-max">/ 1000</span>
              </div>
              {tier ? (
                <p className={`broto-rx-result-hero__tier ${tier.className}`}>{tier.label}</p>
              ) : null}
              <p className="broto-rx-result-hero__meta">
                {redacao.linha_count} linhas · {tema?.titulo}
              </p>
            </section>

            <section className="broto-rx-result-comps" aria-labelledby="redacao-competencias-title">
              <h2 id="redacao-competencias-title" className="broto-rx-result-section-title">
                Notas por competência
              </h2>
              <div className="broto-rx-result-comps__grid">
                {REDACAO_COMPETENCIAS.map((comp) => (
                  <CompetenciaNotaCard
                    key={comp}
                    competencia={comp}
                    nota={getNotaCompetencia(correcao, comp)}
                    justificativa={getJustificativaCompetencia(correcao, comp)}
                    isWeakest={weakest === comp}
                    expanded={expandedComp === comp}
                    onToggle={() => toggleComp(comp)}
                  />
                ))}
              </div>
            </section>

            <RedacaoTextoMarcado
              texto={redacao.texto}
              marcacoes={correcao.marcacoes_inline}
              activeCompetencia={expandedComp}
            />

            {weakest ? (
              <section
                className="broto-rx-result-repertorios"
                aria-labelledby="redacao-repertorios-title"
              >
                <h2 id="redacao-repertorios-title" className="broto-rx-result-section-title">
                  <BookOpen size={18} aria-hidden />
                  Repertórios para melhorar a Competência {weakest}
                </h2>
                <p className="broto-rx-result-repertorios__subtitle">
                  Foco em {REDACAO_COMPETENCIA_SHORT[weakest]} — materiais do seu professor.
                </p>

                {loadingRepertorios ? (
                  <p className="broto-rx-result-repertorios__loading">Carregando repertórios…</p>
                ) : null}

                {!loadingRepertorios && repertoriosSugeridos.length === 0 ? (
                  <p className="broto-rx-result-repertorios__empty">
                    Seu professor ainda não cadastrou repertórios para esta competência.
                  </p>
                ) : null}

                {!loadingRepertorios && repertoriosSugeridos.length > 0 ? (
                  <ul className="broto-rx-result-repertorios__list">
                    {repertoriosSugeridos.map((item) => (
                      <li key={item.id} className="broto-rx-result-repertorio-card">
                        <span className="broto-rx-result-repertorio-card__tipo">{item.tipo}</span>
                        <h3 className="broto-rx-result-repertorio-card__title">{item.titulo}</h3>
                        <p className="broto-rx-result-repertorio-card__content">{item.conteudo}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            <footer className="broto-rx-result-actions">
              <button
                type="button"
                className="broto-rx-result-cta broto-rx-result-cta--primary"
                onClick={handleReescrever}
              >
                <PenLine size={18} aria-hidden />
                Reescrever este tema
              </button>
              <button
                type="button"
                className="broto-rx-result-cta broto-rx-result-cta--secondary"
                onClick={handlePraticarFraca}
              >
                <Target size={18} aria-hidden />
                Praticar competência mais fraca
              </button>
              <Link to="/redacao/evolucao" className="broto-rx-result-cta broto-rx-result-cta--ghost">
                <TrendingUp size={18} aria-hidden />
                Ver evolução
              </Link>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  )
}
