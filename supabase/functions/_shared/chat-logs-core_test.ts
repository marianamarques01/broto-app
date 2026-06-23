import { assertEquals } from 'jsr:@std/assert@1'
import { chatLogTurnsToMessages, groupChatLogSessions } from './chat-logs-core.ts'

Deno.test(
  'groupChatLogSessions: agrupa por session_id e usa primeira pergunta como preview',
  () => {
    const sessions = groupChatLogSessions(
      [
        {
          session_id: 's1',
          question: 'Segunda pergunta',
          created_at: '2026-06-23T12:00:00Z',
          turn_index: 1,
          class_id: 'class-a',
        },
        {
          session_id: 's1',
          question: 'Primeira pergunta',
          created_at: '2026-06-23T11:00:00Z',
          turn_index: 0,
          class_id: 'class-a',
        },
        {
          session_id: 's2',
          question: 'Outro chat',
          created_at: '2026-06-22T10:00:00Z',
          turn_index: 0,
          class_id: 'class-a',
        },
      ],
      10,
    )

    assertEquals(sessions.length, 2)
    assertEquals(sessions[0]?.sessionId, 's1')
    assertEquals(sessions[0]?.preview, 'Primeira pergunta')
    assertEquals(sessions[0]?.turnCount, 2)
    assertEquals(sessions[1]?.sessionId, 's2')
  },
)

Deno.test('chatLogTurnsToMessages: ordena por turn_index', () => {
  const messages = chatLogTurnsToMessages([
    { question: 'B?', answer: 'B!', turn_index: 1 },
    { question: 'A?', answer: 'A!', turn_index: 0 },
  ])

  assertEquals(messages, [
    { role: 'user', content: 'A?' },
    { role: 'assistant', content: 'A!' },
    { role: 'user', content: 'B?' },
    { role: 'assistant', content: 'B!' },
  ])
})
