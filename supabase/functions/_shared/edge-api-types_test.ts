import { assertEquals } from 'https://deno.land/std@0.168.0/assert/mod.ts'
import {
  parseAnswerQuestionBody,
  parsePracticeSessionProgressBody,
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
