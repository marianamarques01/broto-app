import { assertEquals } from 'jsr:@std/assert@1'
import { resolveEffectiveTopico } from './answer-question-topico.ts'
import { applyTopicPerformanceUpdate } from './answer-question-p-know.ts'
import type { TypedSupabaseClient } from './database.ts'

Deno.test('resolveEffectiveTopico: mappedTopico tem prioridade', () => {
  assertEquals(
    resolveEffectiveTopico({
      mappedTopico: 'genetica',
      clientAreaKey: 'matematica',
      question: { topico_value: 'funcoes' },
    }),
    'genetica',
  )
})

Deno.test('resolveEffectiveTopico: areaKey gera rollup quando mapping ausente', () => {
  assertEquals(
    resolveEffectiveTopico({
      clientAreaKey: 'matematica',
    }),
    '__area__:matematica',
  )
})

Deno.test('resolveEffectiveTopico: question.topico_value como fallback', () => {
  assertEquals(
    resolveEffectiveTopico({
      question: { topico_value: 'funcoes' },
    }),
    'funcoes',
  )
})

Deno.test('resolveEffectiveTopico: question.topico_slug como último fallback', () => {
  assertEquals(
    resolveEffectiveTopico({
      question: { topico_slug: 'probabilidade' },
    }),
    'probabilidade',
  )
})

Deno.test('resolveEffectiveTopico: indefinido sem mapping, areaKey nem question', () => {
  assertEquals(resolveEffectiveTopico({}), undefined)
})

type TableOps = {
  inserts: unknown[]
  upserts: unknown[]
  selects: string[]
}

function createMockAdminClient(tableOps: Record<string, TableOps>): TypedSupabaseClient {
  return {
    from: (table: string) => {
      const ops = tableOps[table] ?? { inserts: [], upserts: [], selects: [] }
      const chain = {
        eq: (_column: string, _value: unknown) => chain,
        order: (_column: string, _opts?: unknown) => chain,
        limit: (_n: number) => chain,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        insert: (row: unknown) => {
          ops.inserts.push(row)
          return Promise.resolve({ error: null })
        },
        upsert: (row: unknown, _opts?: unknown) => {
          ops.upserts.push(row)
          return Promise.resolve({ error: null })
        },
        select: (columns?: string) => {
          if (columns) ops.selects.push(columns)
          return chain
        },
      }
      return chain
    },
  } as unknown as TypedSupabaseClient
}

Deno.test(
  'applyTopicPerformanceUpdate: sem tópico insere data_quality_event e não faz upsert',
  async () => {
    const dataQualityOps: TableOps = { inserts: [], upserts: [], selects: [] }
    const topicPerformanceOps: TableOps = { inserts: [], upserts: [], selects: [] }

    const admin = createMockAdminClient({
      data_quality_events: dataQualityOps,
      topic_performance: topicPerformanceOps,
    })

    const result = await applyTopicPerformanceUpdate(admin, {
      userId: 'user-1',
      questionId: '2024-99',
      isCorrect: true,
      clientAreaKey: null,
    })

    assertEquals(result.status, 'skipped')
    assertEquals(dataQualityOps.inserts.length, 1)
    assertEquals(dataQualityOps.inserts[0], {
      event_type: 'p_know_skipped',
      question_id: '2024-99',
      user_id: 'user-1',
      metadata: { reason: 'topico_undefined', areaKey: null },
    })
    assertEquals(topicPerformanceOps.upserts.length, 0)
  },
)

Deno.test('applyTopicPerformanceUpdate: com mappedTopico faz upsert de p_know', async () => {
  const dataQualityOps: TableOps = { inserts: [], upserts: [], selects: [] }
  const topicPerformanceOps: TableOps = { inserts: [], upserts: [], selects: [] }

  const admin = createMockAdminClient({
    data_quality_events: dataQualityOps,
    topic_performance: topicPerformanceOps,
  })

  const result = await applyTopicPerformanceUpdate(admin, {
    userId: 'user-1',
    questionId: '2024-1',
    isCorrect: true,
    mappedTopico: 'genetica',
    clientAreaKey: null,
  })

  assertEquals(result.status, 'updated')
  if (result.status === 'updated') {
    assertEquals(result.effectiveTopico, 'genetica')
  }
  assertEquals(dataQualityOps.inserts.length, 0)
  assertEquals(topicPerformanceOps.upserts.length, 1)
  const upsert = topicPerformanceOps.upserts[0] as Record<string, unknown>
  assertEquals(upsert.topico_value, 'genetica')
  assertEquals(typeof upsert.p_know, 'number')
})
