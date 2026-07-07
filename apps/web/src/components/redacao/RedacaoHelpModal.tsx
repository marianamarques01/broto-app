import { Loader2, Sparkles, X } from 'lucide-react'
import type { RedacaoRepertorio } from '@broto/shared'
import {
  HELP_TAB_LABELS,
  type HelpTab,
  repertorioTipoLabel,
} from './redacao-editor-utils'

export type RedacaoHelpModalProps = {
  open: boolean
  helpTab: HelpTab
  onHelpTabChange: (tab: HelpTab) => void
  onClose: () => void
  loading: boolean
  repertoriosByTab: Record<HelpTab, RedacaoRepertorio[]>
  expandedRepertorioId: string | null
  onToggleRepertorio: (id: string) => void
}

const TAB_ACCENTS: Record<HelpTab, string> = {
  dicas: 'amber',
  modelos: 'blue',
  repertorios: 'purple',
}

export function RedacaoHelpModal({
  open,
  helpTab,
  onHelpTabChange,
  onClose,
  loading,
  repertoriosByTab,
  expandedRepertorioId,
  onToggleRepertorio,
}: RedacaoHelpModalProps) {
  if (!open) return null

  return (
    <div role="presentation" className="broto-rx-help-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rx-help-title"
        className="broto-rx-help"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="broto-rx-help__head">
          <div className="broto-rx-help__head-icon" aria-hidden>
            <Sparkles size={18} />
          </div>
          <div>
            <h2 id="rx-help-title" className="broto-rx-help__title">
              Material de apoio
            </h2>
            <p className="broto-rx-help__subtitle">
              Dicas, modelos e repertórios curados para este eixo temático.
            </p>
          </div>
          <button type="button" className="broto-rx-help__close" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="broto-rx-help__tabs" role="tablist" aria-label="Categorias">
          {(Object.keys(HELP_TAB_LABELS) as HelpTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`rx-help-tab-${tab}`}
              aria-selected={helpTab === tab}
              aria-controls={`rx-help-panel-${tab}`}
              className={`broto-rx-help__tab broto-rx-help__tab--${TAB_ACCENTS[tab]}${helpTab === tab ? ' broto-rx-help__tab--active' : ''}`}
              onClick={() => onHelpTabChange(tab)}
            >
              {HELP_TAB_LABELS[tab]}
              <span className="broto-rx-help__tab-count">{repertoriosByTab[tab].length}</span>
            </button>
          ))}
        </div>

        <div
          id={`rx-help-panel-${helpTab}`}
          role="tabpanel"
          aria-labelledby={`rx-help-tab-${helpTab}`}
          className={`broto-rx-help__body broto-rx-help__body--${TAB_ACCENTS[helpTab]}`}
        >
          {loading ? (
            <p className="broto-rx-help__state">
              <Loader2 className="broto-redacao-state__spin" size={18} aria-hidden />
              Carregando…
            </p>
          ) : null}

          {!loading && repertoriosByTab[helpTab].length === 0 ? (
            <p className="broto-rx-help__state">
              Nenhum conteúdo de {HELP_TAB_LABELS[helpTab].toLowerCase()} disponível ainda.
            </p>
          ) : null}

          {!loading && repertoriosByTab[helpTab].length > 0 ? (
            <ul className="broto-rx-help-list">
              {repertoriosByTab[helpTab].map((item) => {
                const open = expandedRepertorioId === item.id
                return (
                  <li key={item.id} className="broto-rx-help-item">
                    <button
                      type="button"
                      className="broto-rx-help-item__toggle"
                      aria-expanded={open}
                      onClick={() => onToggleRepertorio(item.id)}
                    >
                      <span className={`broto-rx-help-item__tipo broto-rx-help-item__tipo--${TAB_ACCENTS[helpTab]}`}>
                        {repertorioTipoLabel(item.tipo)}
                      </span>
                      <span className="broto-rx-help-item__title">{item.titulo}</span>
                    </button>
                    {open ? <div className="broto-rx-help-item__body">{item.conteudo}</div> : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
