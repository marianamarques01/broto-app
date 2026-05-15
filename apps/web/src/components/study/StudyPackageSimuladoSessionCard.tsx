import { Link } from 'react-router-dom'
import { ClipboardList, ExternalLink } from 'lucide-react'

export function StudyPackageSimuladoSessionCard({
  areaKey,
  topicoValue,
  topicoLabel,
  areaColor,
  onOpenModal,
}: {
  areaKey: string
  topicoValue: string
  topicoLabel: string
  areaColor: string
  onOpenModal: () => void
}) {
  const simuladoHref = `/study/mock-exam?${new URLSearchParams({ area: areaKey, topico: topicoValue }).toString()}`
  const topicTitle = topicoLabel.trim() || 'tópico'
  return (
    <div
      style={{
        marginTop: 0,
        padding: '18px 20px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${areaColor}33`,
        background: `${areaColor}0c`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${areaColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: areaColor,
          }}
          aria-hidden
        >
          <ClipboardList size={20} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: areaColor,
            }}
          >
            Questões do ENEM
          </p>
          <h3
            style={{
              margin: '6px 0 8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Sessão alinhada a este tópico
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
            }}
          >
            Gere uma <strong style={{ color: 'var(--text-primary)' }}>sessão tipo simulado</strong> focada em{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{topicoLabel}</strong> (área já filtrada).
            Ajuste só a quantidade de questões e o ano.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 10,
              marginTop: 14,
              alignItems: 'stretch',
            }}
          >
            <Link
              to={simuladoHref}
              className="broto-btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              <ExternalLink size={16} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
              Fazer simulado geral
            </Link>
            <button
              type="button"
              className="broto-btn-primary"
              onClick={onOpenModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                background: areaColor,
              }}
            >
              Fazer sessão de {topicTitle}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
