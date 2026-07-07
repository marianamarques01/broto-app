import { createElement, type CSSProperties } from 'react'
import { CircleHelp, FileText } from 'lucide-react'
import {
  REDACAO_DIFICULDADE_LABELS,
  REDACAO_EIXO_LABELS,
  type RedacaoTema,
} from '@broto/shared'
import { getRedacaoEixoColor, REDACAO_EIXO_ICONS } from '@/lib/redacao-eixo-ui'

export type RedacaoPropostaPanelProps = {
  tema: RedacaoTema
  onOpenHelp: () => void
}

export function RedacaoPropostaPanel({ tema, onOpenHelp }: RedacaoPropostaPanelProps) {
  const eixoColor = getRedacaoEixoColor(tema.eixo_tematico)

  return (
    <aside className="broto-rx-proposta" aria-labelledby="rx-proposta-title">
      <div className="broto-rx-proposta__inner">
        <div className="broto-rx-panel-card broto-rx-panel-card--proposta">
          <div className="broto-rx-proposta__content">
            <header className="broto-rx-proposta__head">
              <div className="broto-rx-proposta__head-top">
                <span className="broto-rx-proposta__eyebrow">
                  <FileText size={13} aria-hidden />
                  Proposta de redação
                </span>
                <button
                  type="button"
                  className="broto-rx-proposta__help"
                  aria-label="Dicas, modelos e repertórios"
                  title="Material de apoio"
                  onClick={onOpenHelp}
                >
                  <CircleHelp size={17} aria-hidden />
                </button>
              </div>
              <div className="broto-rx-proposta__tags">
                <span
                  className="broto-rx-proposta__tag broto-rx-proposta__tag--eixo"
                  style={{ '--eixo-color': eixoColor } as CSSProperties}
                >
                  {createElement(REDACAO_EIXO_ICONS[tema.eixo_tematico], { size: 11, 'aria-hidden': true })}
                  {REDACAO_EIXO_LABELS[tema.eixo_tematico]}
                </span>
                <span className="broto-rx-proposta__tag broto-rx-proposta__tag--neutral">
                  {REDACAO_DIFICULDADE_LABELS[tema.dificuldade]}
                </span>
                {tema.ano_referencia ? (
                  <span className="broto-rx-proposta__tag broto-rx-proposta__tag--neutral">
                    {tema.ano_referencia}
                  </span>
                ) : null}
              </div>
              <h2 id="rx-proposta-title" className="broto-rx-proposta__title">
                {tema.titulo}
              </h2>
              <p className="broto-rx-proposta__lead">
                Leia os textos motivadores e produza um texto dissertativo-argumentativo em prosa.
              </p>
            </header>

            <div className="broto-rx-proposta__motivadores">
              {tema.textos_motivadores.map((motivador, index) => (
                <article key={motivador.ordem} className="broto-rx-motivador">
                  <span className="broto-rx-motivador__index" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="broto-rx-motivador__content">
                    {motivador.titulo ? (
                      <h3 className="broto-rx-motivador__title">{motivador.titulo}</h3>
                    ) : null}
                    <p className="broto-rx-motivador__text">{motivador.conteudo}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
