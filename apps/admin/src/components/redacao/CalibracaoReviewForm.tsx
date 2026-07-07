import { useState } from 'react'
import {
  REDACAO_COMPETENCIA_SHORT,
  REDACAO_COMPETENCIAS,
  type RedacaoNotaCompetencia,
} from '@broto/shared'
import { REDACAO_NOTAS_VALIDAS } from './CalibracaoMetricsPanel'
import type { CalibracaoSubmitInput } from '@/hooks/useRedacaoCalibracao'

type Props = {
  correcaoId: string
  disabled: boolean
  onSubmit: (input: CalibracaoSubmitInput) => Promise<{ error: string | null }>
}

const NOTA_FIELDS: Record<
  (typeof REDACAO_COMPETENCIAS)[number],
  keyof Pick<
    CalibracaoSubmitInput,
    'nota_humana_i' | 'nota_humana_ii' | 'nota_humana_iii' | 'nota_humana_iv' | 'nota_humana_v'
  >
> = {
  I: 'nota_humana_i',
  II: 'nota_humana_ii',
  III: 'nota_humana_iii',
  IV: 'nota_humana_iv',
  V: 'nota_humana_v',
}

export function CalibracaoReviewForm({ correcaoId, disabled, onSubmit }: Props) {
  const [notas, setNotas] = useState<
    Record<(typeof REDACAO_COMPETENCIAS)[number], RedacaoNotaCompetencia>
  >({
    I: 120,
    II: 120,
    III: 120,
    IV: 120,
    V: 120,
  })
  const [comentario, setComentario] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    const result = await onSubmit({
      correcao_id: correcaoId,
      nota_humana_i: notas.I,
      nota_humana_ii: notas.II,
      nota_humana_iii: notas.III,
      nota_humana_iv: notas.IV,
      nota_humana_v: notas.V,
      comentario: comentario.trim() || null,
    })

    if (result.error) setLocalError(result.error)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
        Atribua sua nota por competência antes de ver a correção da IA.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {REDACAO_COMPETENCIAS.map((comp) => (
          <label
            key={comp}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14 }}>
              <strong>Comp. {comp}</strong> — {REDACAO_COMPETENCIA_SHORT[comp]}
            </span>
            <select
              value={notas[comp]}
              disabled={disabled}
              onChange={(e) =>
                setNotas((prev) => ({
                  ...prev,
                  [comp]: Number(e.target.value) as RedacaoNotaCompetencia,
                }))
              }
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-void)',
                color: 'var(--text-primary)',
              }}
            >
              {REDACAO_NOTAS_VALIDAS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span style={{ display: 'none' }}>{NOTA_FIELDS[comp]}</span>
          </label>
        ))}
      </div>

      <label style={{ display: 'block', marginTop: 16 }}>
        <span style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
          Comentário (opcional)
        </span>
        <textarea
          value={comentario}
          disabled={disabled}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Observações sobre a avaliação…"
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-void)',
            color: 'var(--text-primary)',
            resize: 'vertical',
          }}
        />
      </label>

      {localError ? (
        <p style={{ color: 'var(--danger, #fb7e6a)', marginTop: 12, fontSize: 13 }}>{localError}</p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        style={{
          marginTop: 16,
          background: 'var(--green-600)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {disabled ? 'Salvando…' : 'Submeter revisão e revelar nota IA'}
      </button>
    </form>
  )
}
