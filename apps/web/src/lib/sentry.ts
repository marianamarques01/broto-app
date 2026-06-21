import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

declare global {
  interface Window {
    /** Dispara evento de teste no Sentry (só quando VITE_SENTRY_DSN está definido). */
    __brotoSentryTest?: () => void
  }
}

export function isSentryEnabled(): boolean {
  return Boolean(dsn)
}

export function initSentry(): void {
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  })

  window.__brotoSentryTest = () => {
    Sentry.captureMessage('Broto Sentry test event', 'info')
  }
}

/** Apenas user.id e organization_id — sem email/nome (LGPD). */
export function syncSentryUserContext(userId: string | null, organizationId: string | null): void {
  if (!isSentryEnabled()) return

  if (!userId) {
    Sentry.setUser(null)
    return
  }

  Sentry.setUser({ id: userId })
  Sentry.setTag('organization_id', organizationId ?? 'none')
}
