import type { ChangeEvent } from 'react'

const ENEM_MAX_LINHAS = 30

export type RedacaoWriteCanvasProps = {
  texto: string
  onTextChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  draftError: string | null
  repertorioError: string | null
}

export function RedacaoWriteCanvas({
  texto,
  onTextChange,
  draftError,
  repertorioError,
}: RedacaoWriteCanvasProps) {
  const error = draftError ?? repertorioError

  return (
    <section className="broto-rx-canvas" aria-label="Área de escrita">
      {error ? (
        <p className="broto-rx-doc__error broto-rx-canvas__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="broto-rx-canvas__scroll">
        <div className="broto-rx-doc">
          <div className="broto-rx-panel-card broto-rx-panel-card--write">
            <div className="broto-rx-sheet">
              <div className="broto-rx-sheet__gutter" aria-hidden>
                {Array.from({ length: ENEM_MAX_LINHAS }, (_, i) => (
                  <span key={i + 1}>{i + 1}</span>
                ))}
              </div>
              <textarea
                className="broto-rx-sheet__input"
                value={texto}
                onChange={onTextChange}
                placeholder="Comece sua introdução aqui. Desenvolva argumentos sólidos e conclua com uma proposta de intervenção…"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                aria-label="Texto da redação"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
