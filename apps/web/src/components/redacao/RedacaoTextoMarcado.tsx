import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import {
  REDACAO_COMPETENCIA_COLORS,
  REDACAO_COMPETENCIA_SHORT,
  type MarcacaoInline,
  type RedacaoCompetencia,
} from '@broto/shared'
import { buildTextoMarcadoSegments, marcacoesSignature } from './redacao-texto-marcado-utils'

type RedacaoTextoMarcadoProps = {
  texto: string
  marcacoes: MarcacaoInline[]
  activeCompetencia?: RedacaoCompetencia | null
}

function isSameMarcacao(a: MarcacaoInline, b: MarcacaoInline): boolean {
  return (
    a.start_offset === b.start_offset &&
    a.end_offset === b.end_offset &&
    a.competencia === b.competencia &&
    a.tipo_problema === b.tipo_problema
  )
}

export function RedacaoTextoMarcado({
  texto,
  marcacoes,
  activeCompetencia = null,
}: RedacaoTextoMarcadoProps) {
  const [activeMarcacao, setActiveMarcacao] = useState<MarcacaoInline | null>(null)

  const filteredMarcacoes = useMemo(() => {
    if (!activeCompetencia) return marcacoes
    return marcacoes.filter((m) => m.competencia === activeCompetencia)
  }, [activeCompetencia, marcacoes])

  const segments = useMemo(
    () => buildTextoMarcadoSegments(texto, filteredMarcacoes),
    [filteredMarcacoes, texto],
  )

  const legendCompetencias = useMemo(() => {
    const set = new Set<RedacaoCompetencia>()
    for (const m of filteredMarcacoes) set.add(m.competencia)
    return [...set]
  }, [filteredMarcacoes])

  const activeSegment = useMemo(() => {
    if (!activeMarcacao) return null
    return segments.find((s) => s.marcacoes.some((m) => isSameMarcacao(m, activeMarcacao))) ?? null
  }, [activeMarcacao, segments])

  return (
    <section className="broto-rx-marked" aria-labelledby="redacao-texto-marcado-title">
      <header className="broto-rx-marked__header">
        <h2 id="redacao-texto-marcado-title" className="broto-rx-marked__title">
          Seu texto com marcações
        </h2>
        <p className="broto-rx-marked__hint">
          Toque nos trechos destacados para ver o comentário específico.
        </p>
      </header>

      {legendCompetencias.length > 0 ? (
        <ul className="broto-rx-marked__legend" aria-label="Legenda por competência">
          {legendCompetencias.map((comp) => (
            <li key={comp}>
              <span
                className="broto-rx-marked__legend-dot"
                style={{ '--comp-color': REDACAO_COMPETENCIA_COLORS[comp] } as CSSProperties}
                aria-hidden
              />
              Comp. {comp} — {REDACAO_COMPETENCIA_SHORT[comp]}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="broto-rx-marked__paper">
        {segments.map((segment) => {
          if (segment.marcacoes.length === 0) {
            return <span key={`${segment.start}-${segment.end}`}>{segment.text}</span>
          }

          const primary = segment.marcacoes[0]!
          const color = REDACAO_COMPETENCIA_COLORS[primary.competencia]
          const sig = marcacoesSignature(segment.marcacoes)

          return (
            <mark
              key={`${segment.start}-${segment.end}-${sig}`}
              className="broto-rx-marked__highlight"
              style={{ '--comp-color': color } as CSSProperties}
              data-competencia={primary.competencia}
              onClick={() => setActiveMarcacao(primary)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveMarcacao(primary)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Marcação: ${primary.tipo_problema}. ${primary.comentario}`}
            >
              {segment.text}
            </mark>
          )
        })}
      </div>

      {filteredMarcacoes.length === 0 ? (
        <p className="broto-rx-marked__empty">
          Nenhuma marcação inline nesta redação
          {activeCompetencia ? ` para a competência ${activeCompetencia}` : ''}.
        </p>
      ) : null}

      {activeMarcacao ? (
        <aside
          className="broto-rx-marked__popover"
          role="dialog"
          aria-label="Comentário da marcação"
        >
          <button
            type="button"
            className="broto-rx-marked__popover-close"
            onClick={() => setActiveMarcacao(null)}
            aria-label="Fechar comentário"
          >
            <X size={16} aria-hidden />
          </button>
          <span
            className="broto-rx-marked__popover-badge"
            style={
              {
                '--comp-color': REDACAO_COMPETENCIA_COLORS[activeMarcacao.competencia],
              } as CSSProperties
            }
          >
            Comp. {activeMarcacao.competencia} · {activeMarcacao.tipo_problema}
          </span>
          <p className="broto-rx-marked__popover-trecho">&ldquo;{activeMarcacao.trecho}&rdquo;</p>
          <p className="broto-rx-marked__popover-comment">{activeMarcacao.comentario}</p>
          {(activeSegment?.marcacoes.length ?? 0) > 1 ? (
            <p className="broto-rx-marked__popover-more">
              Este trecho tem mais de uma observação. Clique em outras marcações para comparar.
            </p>
          ) : null}
        </aside>
      ) : null}
    </section>
  )
}
