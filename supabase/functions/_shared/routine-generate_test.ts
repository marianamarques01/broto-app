import { assertEquals } from 'jsr:@std/assert@1'
import {
  buildLocalFallbackRoutine,
  FASTAPI_TIMEOUT_MS,
  fetchFastApiRoutine,
  pKnowConfidenceFromObservations,
  resolveFastApiServiceUrl,
  type TopicPerformanceInput,
} from './routine-generate.ts'

const performanceFixture: TopicPerformanceInput[] = [
  {
    topico_value: 'genetica',
    area_key: 'ciencias-natureza',
    p_know: 0.8,
    accuracy_pct: 80,
    total_answered: 12,
  },
  {
    topico_value: 'funcoes',
    area_key: 'matematica',
    p_know: 0.2,
    accuracy_pct: 30,
    total_answered: 5,
  },
  {
    topico_value: 'interpretacao',
    area_key: 'linguagens',
    p_know: 0.5,
    accuracy_pct: 55,
    total_answered: 4,
  },
]

Deno.test('routine-generate: resolveFastApiServiceUrl prioriza FASTAPI_URL', () => {
  assertEquals(
    resolveFastApiServiceUrl('https://fast.example', 'https://notebook.example'),
    'https://fast.example',
  )
  assertEquals(resolveFastApiServiceUrl('', 'https://notebook.example'), 'https://notebook.example')
  assertEquals(resolveFastApiServiceUrl(null, null), '')
})

Deno.test('routine-generate: fallback local ordena sessions por p_know ascendente', () => {
  const routine = buildLocalFallbackRoutine(performanceFixture, 2)
  const pKnows = routine.sessions.map((s) => s.p_know)
  assertEquals(pKnows, [0.2, 0.5, 0.8])
  assertEquals(routine.sessions[0]?.topic, 'funcoes')
  assertEquals(routine.source, 'local_fallback')
})

Deno.test('routine-generate: confiança do p_know por total_answered', () => {
  assertEquals(pKnowConfidenceFromObservations(0), 'low')
  assertEquals(pKnowConfidenceFromObservations(5), 'medium')
  assertEquals(pKnowConfidenceFromObservations(10), 'high')
})

Deno.test('routine-generate: fetchFastApiRoutine aborta após timeout', async () => {
  const started = Date.now()
  const slowFetch: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

  const result = await fetchFastApiRoutine(
    'https://invalid-fastapi.example',
    {
      user_id: 'u1',
      hours_per_day: 2,
      exam_date: null,
      target_score: 700,
      performance: [],
    },
    { timeoutMs: 50, fetchFn: slowFetch },
  )

  const elapsed = Date.now() - started
  assertEquals(result, null)
  assertEquals(elapsed < FASTAPI_TIMEOUT_MS, true)
  assertEquals(elapsed >= 40, true)
})
