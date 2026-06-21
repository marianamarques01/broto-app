import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { StudyPackage } from '@/lib/study-area-mock'

export function SummarySection({
  summary,
  areaColor,
  onDone,
}: {
  summary: StudyPackage['summary']
  areaColor: string
  onDone: () => void
}) {
  return (
    <div>
      <h2
        style={{
          margin: '0 0 18px',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {summary.title}
      </h2>

      <div
        style={{
          fontSize: '0.9rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {summary.content.split('\n\n').map((paragraph, i) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3
                key={i}
                style={{
                  margin: '20px 0 8px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {paragraph.replace('### ', '')}
              </h3>
            )
          }
          if (paragraph.startsWith('- ')) {
            return (
              <ul key={i} style={{ margin: '8px 0', paddingLeft: 20 }}>
                {paragraph.split('\n').map((line, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    {line
                      .replace('- ', '')
                      .split('**')
                      .map((seg, k) =>
                        k % 2 === 1 ? (
                          <strong key={k} style={{ color: 'var(--text-primary)' }}>
                            {seg}
                          </strong>
                        ) : (
                          <span key={k}>{seg}</span>
                        ),
                      )}
                  </li>
                ))}
              </ul>
            )
          }
          return (
            <p key={i} style={{ margin: '10px 0' }}>
              {paragraph.split('**').map((seg, k) =>
                k % 2 === 1 ? (
                  <strong key={k} style={{ color: 'var(--text-primary)' }}>
                    {seg}
                  </strong>
                ) : (
                  <span key={k}>{seg}</span>
                ),
              )}
            </p>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: `${areaColor}08`,
          border: `1px solid ${areaColor}18`,
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: areaColor,
          }}
        >
          Pontos-chave
        </p>
        {summary.keyPoints.map((point, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}
          >
            <CheckCircle2 size={14} color={areaColor} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {point}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="broto-btn-primary"
        style={{ marginTop: 20, justifyContent: 'center' }}
      >
        Continuar leitura e seguir <ArrowRight size={18} />
      </button>
    </div>
  )
}
