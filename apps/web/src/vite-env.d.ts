/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BETA_FEEDBACK_FORM_URL?: string
  /** Tour pós-onboarding. Defina `false` para desligar (padrão: ligado). */
  readonly VITE_APP_INTEGRATED_TOUR?: string
  /** Sentry DSN — opcional; sem valor, observabilidade fica desligada. */
  readonly VITE_SENTRY_DSN?: string
}
