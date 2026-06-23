import type { Material } from '@broto/shared'
import { MaterialStatusBadge } from './MaterialStatusBadge'

type Props = {
  materials: Material[]
  loading: boolean
  ragEnabled?: boolean
  reindexing?: boolean
  onDelete: (materialId: string) => Promise<{ error: string | null }>
  onReindexAll?: () => void
}

export function MaterialsList({
  materials,
  loading,
  ragEnabled,
  reindexing,
  onDelete,
  onReindexAll,
}: Props) {
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Carregando materiais...</p>

  const typeLabel: Record<string, string> = {
    pdf: 'PDF',
    url: 'URL',
    youtube: 'YouTube',
    text: 'Texto',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Materiais ({materials.length})</h3>
        {ragEnabled && onReindexAll && materials.length > 0 && (
          <button
            type="button"
            onClick={onReindexAll}
            disabled={reindexing}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-elevated)',
              color: 'var(--green-400)',
              cursor: reindexing ? 'wait' : 'pointer',
              opacity: reindexing ? 0.7 : 1,
            }}
          >
            {reindexing ? 'Indexando…' : 'Reindexar RAG'}
          </button>
        )}
      </div>

      {materials.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Nenhum material adicionado ainda. Use o painel ao lado para adicionar.
        </div>
      ) : (
        <div>
          {materials.map((material) => (
            <div
              key={material.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
                    {typeLabel[material.type] ?? material.type}
                  </span>
                  <MaterialStatusBadge status={material.index_status} />
                </div>
                <p
                  style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}
                >
                  {material.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  {new Date(material.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                <a
                  href={material.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: 'var(--green-600)',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-strong)',
                  }}
                >
                  Abrir
                </a>
                <button
                  onClick={() => onDelete(material.id)}
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
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
