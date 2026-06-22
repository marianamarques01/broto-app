export const FASTAPI_TIMEOUT_MS = 10_000

export type TopicPerformanceInput = {
  topico_value: string
  area_key: string | null
  p_know: number | null
  accuracy_pct: number | null
  total_answered: number | null
}

export type RoutineGenerateSession = {
  day: number
  topic: string
  area: string
  duration_minutes: number
  p_know: number
  rationale: string
}

export type RoutineGenerateResult = {
  source: string
  generated_at: string
  sessions: RoutineGenerateSession[]
}

export type FastApiPerformanceItem = {
  topic: string
  area: string
  p_know: number
  p_know_confidence: 'high' | 'medium' | 'low'
  accuracy: number | null
  practiced: boolean
}

export type FastApiPayload = {
  user_id: string
  hours_per_day: number
  exam_date: string | null
  target_score: number
  performance: FastApiPerformanceItem[]
}

const DEFAULT_P_KNOW = 0.3

/** Mesmo host do NotebookLM (`/routine/generate` vive no FastAPI Python). */
export function resolveFastApiServiceUrl(
  fastApiUrl?: string | null,
  notebookLmUrl?: string | null,
): string {
  const explicit = fastApiUrl?.trim()
  if (explicit) return explicit
  return notebookLmUrl?.trim() ?? ''
}

export function buildFastApiServiceHeaders(serviceSecret?: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(serviceSecret?.trim() ? { Authorization: `Bearer ${serviceSecret.trim()}` } : {}),
  }
}

export function pKnowConfidenceFromObservations(totalAnswered: number): 'high' | 'medium' | 'low' {
  if (totalAnswered >= 8) return 'high'
  if (totalAnswered >= 3) return 'medium'
  return 'low'
}

export function buildFastApiPayload(
  userId: string,
  profile: {
    hours_per_day: number | null
    exam_date: string | null
    target_score: number | null
  } | null,
  performance: TopicPerformanceInput[],
): FastApiPayload {
  return {
    user_id: userId,
    hours_per_day: profile?.hours_per_day ?? 2,
    exam_date: profile?.exam_date ?? null,
    target_score: profile?.target_score ?? 700,
    performance: performance.map((t) => ({
      topic: t.topico_value,
      area: t.area_key ?? 'unknown',
      p_know: t.p_know ?? DEFAULT_P_KNOW,
      p_know_confidence: pKnowConfidenceFromObservations(t.total_answered ?? 0),
      accuracy: t.accuracy_pct,
      practiced: (t.total_answered ?? 0) > 0,
    })),
  }
}

/** Fallback local: tópicos com menor p_know primeiro (até 5 sessões). */
export function buildLocalFallbackRoutine(
  performance: TopicPerformanceInput[],
  hoursPerDay: number,
  generatedAt = new Date().toISOString(),
): RoutineGenerateResult {
  const prioritized = [...performance]
    .sort((a, b) => (a.p_know ?? DEFAULT_P_KNOW) - (b.p_know ?? DEFAULT_P_KNOW))
    .slice(0, 5)

  const minutesPerSession = Math.round((hoursPerDay * 60) / Math.max(prioritized.length, 1))

  return {
    source: 'local_fallback',
    generated_at: generatedAt,
    sessions: prioritized.map((t, i) => {
      const pKnow = t.p_know ?? DEFAULT_P_KNOW
      return {
        day: i + 1,
        topic: t.topico_value,
        area: t.area_key ?? 'unknown',
        duration_minutes: minutesPerSession,
        p_know: pKnow,
        rationale: `Domínio estimado: ${(pKnow * 100).toFixed(0)}%`,
      }
    }),
  }
}

export async function fetchFastApiRoutine(
  fastApiUrl: string,
  payload: FastApiPayload,
  options?: {
    timeoutMs?: number
    fetchFn?: typeof fetch
    serviceSecret?: string | null
  },
): Promise<RoutineGenerateResult | null> {
  const timeoutMs = options?.timeoutMs ?? FASTAPI_TIMEOUT_MS
  const fetchFn = options?.fetchFn ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchFn(`${fastApiUrl.replace(/\/$/, '')}/routine/generate`, {
      method: 'POST',
      headers: buildFastApiServiceHeaders(options?.serviceSecret),
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn('[routine-generate] FastAPI retornou', response.status)
      return null
    }

    const routine = (await response.json()) as RoutineGenerateResult
    return routine
  } catch (fastApiError) {
    clearTimeout(timeout)
    const message = fastApiError instanceof Error ? fastApiError.message : String(fastApiError)
    console.warn('[routine-generate] FastAPI indisponível, usando fallback', {
      error: message,
      fastapi_url: fastApiUrl,
    })
    return null
  }
}
