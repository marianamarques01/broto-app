import { useState } from 'react'
import type { RedacaoRepertorio } from '@broto/shared'

const TIPO_LABEL: Record<string, string> = {
  dica: 'Dica',
  repertorio: 'Repertório',
  modelo_estrutura: 'Modelo de estrutura',
  conectivos: 'Conectivos',
  proposta_intervencao: 'Proposta de intervenção',
}

const EIXO_LABEL: Record<string, string> = {
  educacao: 'Educação',
  saude: 'Saúde',
  meio_ambiente: 'Meio ambiente',
  tecnologia: 'Tecnologia',
  trabalho: 'Trabalho',
  direitos_humanos: 'Direitos humanos',
  cultura: 'Cultura',
}

type Props = {
  repertorios: RedacaoRepertorio[]
  loading: boolean
  classId: string
  onDeactivate: (id: string) => Promise<{ error: string | null }>
  onEdit: (item: RedacaoRepertorio) => void
  onReactivate: (item: RedacaoRepertorio) => Promise<{ error: string | null }>
}

export function RepertoriosList({
  repertorios,
  loading,
  classId,
  onDeactivate,
  onEdit,
  onReactivate,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Carregando repertórios...</p>
  }

  const ativos = repertorios.filter((r) => r.ativo)
  const inativos = repertorios.filter((r) => !r.ativo)

  async function handleDeactivate(id: string) {
    setBusyId(id)
    const { error } = await onDeactivate(id)
    if (error) alert(error)
    setBusyId(null)
  }

  async function handleReactivate(item: RedacaoRepertorio) {
    setBusyId(item.id)
    const { error } = await onReactivate(item)
    if (error) alert(error)
    setBusyId(null)
  }

  function renderItem(item: RedacaoRepertorio, inactive: boolean) {
    const scopeLabel = item.class_id
      ? item.class_id === classId
        ? 'Esta turma'
        : 'Outra turma'
      : 'Toda a organização'

    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          opacity: inactive ? 0.65 : 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {TIPO_LABEL[item.tipo] ?? item.tipo}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--green-glow)',
                color: 'var(--green-400)',
                fontWeight: 500,
              }}
            >
              {scopeLabel}
            </span>
            {item.competencia_alvo && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Comp. {item.competencia_alvo}
              </span>
            )}
            {item.eixo_tematico && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {EIXO_LABEL[item.eixo_tematico] ?? item.eixo_tematico}
              </span>
            )}
            {inactive && (
              <span style={{ fontSize: 11, color: 'var(--red-400)', fontWeight: 500 }}>
                Inativo
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
            {item.titulo}
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '6px 0 0',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.conteudo}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
          {!inactive && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              style={{
                fontSize: 12,
                color: 'var(--green-600)',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              Editar
            </button>
          )}
          {inactive ? (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void handleReactivate(item)}
              style={{
                fontSize: 12,
                color: 'var(--green-400)',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              Reativar
            </button>
          ) : (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void handleDeactivate(item.id)}
              style={{
                fontSize: 12,
                color: 'var(--red-400)',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              Desativar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          Repertórios de redação ({ativos.length} ativos)
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
          Conteúdo pedagógico visível aos alunos no editor e após correção.
        </p>
      </div>

      {repertorios.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Nenhum repertório cadastrado. Use o painel ao lado para adicionar dicas e modelos.
        </div>
      ) : (
        <div>
          {ativos.map((item) => renderItem(item, false))}
          {inativos.length > 0 && (
            <div
              style={{
                padding: '10px 20px',
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              Inativos ({inativos.length})
            </div>
          )}
          {inativos.map((item) => renderItem(item, true))}
        </div>
      )}
    </div>
  )
}
