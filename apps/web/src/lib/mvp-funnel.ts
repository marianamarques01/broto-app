/**
 * Instrumentação mínima do funil MVP (cadastro → onboarding → primeira sessão tipo simulado).
 * Dev: console.debug. Produção: marcações em localStorage para suporte/demos;
 * trocar por PostHog/GA sem mudar call sites.
 */

const STORAGE_NS = 'broto:mvp:funnel'

export type MvpFunnelStep =
  | 'signup_success'
  | 'onboarding_complete'
  | 'first_mock_exam_started'

export function trackMvpFunnelStep(step: MvpFunnelStep, payload?: Record<string, unknown>): void {
  const ts = new Date().toISOString()
  const body = { ts, ...payload }

  if (import.meta.env.DEV) {
    console.debug('[mvp-funnel]', step, body)
  }

  try {
    const key = `${STORAGE_NS}:${step}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, JSON.stringify(body))
  } catch {
    // quota / private mode
  }
}
