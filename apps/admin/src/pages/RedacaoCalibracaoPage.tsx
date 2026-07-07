import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { REDACAO_EIXO_LABELS, isRedacaoEixoTematico } from '@broto/shared'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useRedacaoCalibracao } from '@/hooks/useRedacaoCalibracao'
import { CalibracaoMetricsPanel } from '@/components/redacao/CalibracaoMetricsPanel'
import { CalibracaoReviewForm } from '@/components/redacao/CalibracaoReviewForm'
import { CalibracaoComparacaoPanel } from '@/components/redacao/CalibracaoComparacaoPanel'

const CALIBRATION_ROLES = ['owner', 'org_admin'] as const

export function RedacaoCalibracaoPage() {
  const { admin } = useAdminAuth()
  const {
    items,
    metrics,
    loadingList,
    loadingMetrics,
    loadingReview,
    submitting,
    error,
    review,
    comparacao,
    loadReview,
    submitReview,
    clearReview,
  } = useRedacaoCalibracao()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!admin) return null

  if (!CALIBRATION_ROLES.includes(admin.role as (typeof CALIBRATION_ROLES)[number])) {
    return <Navigate to="/" replace />
  }

  async function handleSelect(correcaoId: string) {
    setSelectedId(correcaoId)
    await loadReview(correcaoId)
  }

  const pendingItems = items.filter((item) => !item.revisado_por_mim)

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-void)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Calibração de redação" />

        <main
          style={{
            padding: '24px 32px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <CalibracaoMetricsPanel
            totalRevisoes={metrics?.total_revisoes ?? 0}
            porCompetencia={metrics?.por_competencia ?? []}
            loading={loadingMetrics}
          />

          {error ? (
            <p style={{ color: 'var(--danger, #fb7e6a)', margin: 0, fontSize: 14 }}>{error}</p>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(260px, 320px) 1fr',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <aside
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 16,
                maxHeight: '70vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
                Amostra para revisão
              </h2>
              {loadingList ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando…</p>
              ) : items.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Nenhuma redação corrigida disponível.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {items.map((item) => {
                    const active = selectedId === item.correcao_id
                    const eixoLabel = isRedacaoEixoTematico(item.eixo_tematico)
                      ? REDACAO_EIXO_LABELS[item.eixo_tematico]
                      : item.eixo_tematico

                    return (
                      <li key={item.correcao_id}>
                        <button
                          type="button"
                          onClick={() => void handleSelect(item.correcao_id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: 12,
                            borderRadius: 8,
                            border: active
                              ? '1px solid var(--green-500, #2dd4a8)'
                              : '1px solid var(--border-subtle)',
                            background: active ? 'rgba(46, 204, 142, 0.1)' : 'var(--bg-void)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                            {item.tema_titulo}
                          </p>
                          <p
                            style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}
                          >
                            {eixoLabel} · {item.linha_count} linhas
                          </p>
                          <p
                            style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}
                          >
                            {item.revisado_por_mim
                              ? 'Revisado por você'
                              : item.revisado
                                ? 'Revisado por outro'
                                : 'Pendente'}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {!loadingList && pendingItems.length > 0 ? (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  {pendingItems.length} pendente{pendingItems.length === 1 ? '' : 's'} para você
                </p>
              ) : null}
            </aside>

            <section
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 20,
                minHeight: 360,
              }}
            >
              {!selectedId || !review ? (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  {loadingReview
                    ? 'Carregando redação…'
                    : 'Selecione uma redação na lista para iniciar a revisão cega.'}
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>
                      {review.tema.titulo}
                    </h2>
                    {review.tema.textos_motivadores.length > 0 ? (
                      <details style={{ marginBottom: 12 }}>
                        <summary
                          style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}
                        >
                          Textos motivadores
                        </summary>
                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                          {review.tema.textos_motivadores.map((m) => (
                            <p key={m.ordem} style={{ margin: '0 0 8px' }}>
                              {m.titulo ? <strong>{m.titulo}: </strong> : null}
                              {m.conteudo}
                            </p>
                          ))}
                        </div>
                      </details>
                    ) : null}
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: 0,
                        padding: 16,
                        borderRadius: 8,
                        background: 'var(--bg-void)',
                        border: '1px solid var(--border-subtle)',
                        maxHeight: 280,
                        overflowY: 'auto',
                      }}
                    >
                      {review.redacao.texto}
                    </pre>
                  </div>

                  {!review.ia_revelada && !comparacao ? (
                    <CalibracaoReviewForm
                      correcaoId={review.correcao.id}
                      disabled={submitting || loadingReview}
                      onSubmit={submitReview}
                    />
                  ) : null}

                  {comparacao ? <CalibracaoComparacaoPanel comparacao={comparacao} /> : null}

                  {review.ia_revelada ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearReview()
                        setSelectedId(null)
                      }}
                      style={{
                        marginTop: 20,
                        background: 'transparent',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Voltar à lista
                    </button>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
