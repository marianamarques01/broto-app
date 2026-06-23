import { assertEquals } from 'jsr:@std/assert@1'
import {
  parseAnswerQuestionBody,
  parseBrotoChatBody,
  parseBrotoChatSessionGetBody,
  parseBrotoChatSessionsListBody,
  parseMaterialEmbedBody,
  parsePracticeSessionProgressBody,
  parseSemanticSearchBody,
  parseSessionIdBody,
} from './edge-api-types.ts'

Deno.test('parseSessionIdBody: aceita sessionId trimado', () => {
  assertEquals(parseSessionIdBody({ sessionId: '  abc-123  ' }), 'abc-123')
})

Deno.test('parseSessionIdBody: rejeita ausente ou vazio', () => {
  assertEquals(parseSessionIdBody(null), null)
  assertEquals(parseSessionIdBody({ sessionId: '   ' }), null)
})

Deno.test('parseAnswerQuestionBody: payload mínimo válido', () => {
  const body = parseAnswerQuestionBody({
    questionId: ' q-1 ',
    isCorrect: true,
    areaKey: 'matematica',
  })
  assertEquals(body?.questionId, 'q-1')
  assertEquals(body?.isCorrect, true)
  assertEquals(body?.areaKey, 'matematica')
})

Deno.test('parseAnswerQuestionBody: areaKey inválida omitida', () => {
  const body = parseAnswerQuestionBody({
    questionId: 'q-1',
    areaKey: 'historia',
  })
  assertEquals(body?.questionId, 'q-1')
  assertEquals(body?.areaKey, undefined)
})

Deno.test('parsePracticeSessionProgressBody: progress válido', () => {
  const body = parsePracticeSessionProgressBody({
    sessionId: 'sess-1',
    progress: { currentIndex: 2, skippedQuestionIds: ['q-a', 'q-b'] },
  })
  assertEquals(body?.sessionId, 'sess-1')
  assertEquals(body?.progress.currentIndex, 2)
  assertEquals(body?.progress.skippedQuestionIds, ['q-a', 'q-b'])
})

Deno.test('parsePracticeSessionProgressBody: rejeita currentIndex inválido', () => {
  assertEquals(
    parsePracticeSessionProgressBody({
      sessionId: 'sess-1',
      progress: { currentIndex: 'x' },
    }),
    null,
  )
})

Deno.test('parseBrotoChatBody: aceita messages com sessionId e turnIndex', () => {
  const body = parseBrotoChatBody({
    messages: [{ role: 'user', content: 'Oi' }],
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    turnIndex: 2,
  })
  assertEquals(body?.messages.length, 1)
  assertEquals(body?.sessionId, '550e8400-e29b-41d4-a716-446655440000')
  assertEquals(body?.turnIndex, 2)
})

Deno.test('parseBrotoChatBody: turnIndex padrão 0 e sessionId inválido omitido', () => {
  const body = parseBrotoChatBody({
    messages: [{ role: 'user', content: 'Oi' }],
    sessionId: 'not-a-uuid',
  })
  assertEquals(body?.turnIndex, 0)
  assertEquals(body?.sessionId, undefined)
})

Deno.test('parseBrotoChatBody: aceita classId UUID opcional', () => {
  const body = parseBrotoChatBody({
    messages: [{ role: 'user', content: 'Oi' }],
    classId: '550e8400-e29b-41d4-a716-446655440000',
  })
  assertEquals(body?.classId, '550e8400-e29b-41d4-a716-446655440000')
})

Deno.test('parseBrotoChatBody: rejeita messages ausente', () => {
  assertEquals(parseBrotoChatBody({ sessionId: '550e8400-e29b-41d4-a716-446655440000' }), null)
})

Deno.test('parseBrotoChatSessionsListBody: limit padrão e classId opcional', () => {
  assertEquals(parseBrotoChatSessionsListBody({}), { classId: undefined, limit: 30 })
  assertEquals(parseBrotoChatSessionsListBody({ limit: 999 }), {
    classId: undefined,
    limit: 50,
  })
})

Deno.test('parseBrotoChatSessionGetBody: exige UUID', () => {
  assertEquals(
    parseBrotoChatSessionGetBody({ sessionId: '550e8400-e29b-41d4-a716-446655440000' }),
    '550e8400-e29b-41d4-a716-446655440000',
  )
  assertEquals(parseBrotoChatSessionGetBody({ sessionId: 'not-a-uuid' }), null)
})

Deno.test('parseMaterialEmbedBody: payload válido', () => {
  const body = parseMaterialEmbedBody({
    material_id: '550e8400-e29b-41d4-a716-446655440000',
    class_id: '660e8400-e29b-41d4-a716-446655440001',
    chunks: [{ text: '  Introdução  ', tokens: 12, metadata: { page_number: 1 } }],
  })
  assertEquals(body?.material_id, '550e8400-e29b-41d4-a716-446655440000')
  assertEquals(body?.chunks[0].text, 'Introdução')
  assertEquals(body?.chunks[0].tokens, 12)
})

Deno.test('parseMaterialEmbedBody: rejeita chunks vazio', () => {
  assertEquals(
    parseMaterialEmbedBody({
      material_id: '550e8400-e29b-41d4-a716-446655440000',
      class_id: '660e8400-e29b-41d4-a716-446655440001',
      chunks: [],
    }),
    null,
  )
})

Deno.test('parseSemanticSearchBody: defaults de limit e threshold', () => {
  const body = parseSemanticSearchBody({
    query: '  fotossíntese ',
    class_id: '660e8400-e29b-41d4-a716-446655440001',
  })
  assertEquals(body?.query, 'fotossíntese')
  assertEquals(body?.limit, 5)
  assertEquals(body?.similarity_threshold, 0.5)
})

Deno.test('parseSemanticSearchBody: rejeita query vazia', () => {
  assertEquals(
    parseSemanticSearchBody({ query: '   ', class_id: '660e8400-e29b-41d4-a716-446655440001' }),
    null,
  )
})
