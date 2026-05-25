/**
 * Sobrescreva com `VITE_BETA_FEEDBACK_FORM_URL` no `.env`; localmente copie `.env.example` → `.env`.
 * Sem env definida usamos fallback para o modal aparecer mesmo em dev (troque antes de público ao ar).
 */
const BETA_FEEDBACK_FORM_URL_FALLBACK = 'https://forms.gle/6DsGikwtY1fM5D7c7'

/** Valor crus da env (sem fallback). */
export function getBetaFeedbackFormUrl(): string {
  const raw = import.meta.env.VITE_BETA_FEEDBACK_FORM_URL
  return typeof raw === 'string' ? raw.trim() : ''
}

/** URL efetiva: env ou fallback (nunca vazia — o modal sempre pode abrir). */
export function resolveBetaFeedbackFormUrl(): string {
  const env = getBetaFeedbackFormUrl()
  if (env) return env
  if (import.meta.env.PROD) {
    console.warn('[broto-web] Defina VITE_BETA_FEEDBACK_FORM_URL; usando link placeholder até lá.')
  }
  return BETA_FEEDBACK_FORM_URL_FALLBACK
}

const STORAGE_KEY = 'broto.home.beta-survey.done'

export function readBetaSurveyCompleted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeBetaSurveyCompleted(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore quota / privacy mode
  }
}

interface HomeBetaSurveyModalProps {
  open: boolean
  formUrl: string
  onDismiss: () => void
  onMarkAnswered: () => void
}

export function HomeBetaSurveyModal({
  open,
  formUrl,
  onDismiss,
  onMarkAnswered,
}: HomeBetaSurveyModalProps) {
  if (!open) return null

  return (
    <div
      className="broto-mock-exam-info-modal-backdrop"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="broto-mock-exam-info-modal broto-home-beta-survey-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-beta-survey-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onDismiss()
        }}
      >
        <h2 id="home-beta-survey-title" className="broto-home-beta-survey-modal__title">
          Que tal avaliar nosso beta?
        </h2>
        <p className="broto-home-beta-survey-modal__lead">
          Em poucos minutos você nos ajuda a melhorar o Broto antes do lançamento público.
        </p>
        <div className="broto-home-beta-survey-modal__actions">
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="broto-btn-primary broto-btn-primary--inline broto-home-beta-survey-modal__primary"
          >
            Avaliar no formulário
          </a>
          <button
            type="button"
            className="broto-btn-secondary broto-btn-secondary--inline broto-home-beta-survey-modal__secondary"
            onClick={onDismiss}
          >
            Responder mais tarde
          </button>
          <button type="button" className="broto-home-beta-survey-modal__done" onClick={onMarkAnswered}>
            Já respondi!
          </button>
        </div>
      </div>
    </div>
  )
}
