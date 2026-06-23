import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  buildRagChatMessages,
  buildRagSystemPrompt,
  formatRagContext,
  RAG_NO_CONTEXT_REPLY,
  shouldUseRagChat,
} from './rag-context.ts'

Deno.test('shouldUseRagChat: só true quando rag_enabled explícito', () => {
  assertEquals(shouldUseRagChat(true), true)
  assertEquals(shouldUseRagChat(false), false)
  assertEquals(shouldUseRagChat(null), false)
  assertEquals(shouldUseRagChat(undefined), false)
})

Deno.test('formatRagContext: retorna null sem chunks', () => {
  assertEquals(formatRagContext([]), null)
})

Deno.test('formatRagContext: inclui texto e metadata', () => {
  const block = formatRagContext([
    {
      id: '1',
      chunk_text: 'A fotossíntese produz oxigênio.',
      similarity: 0.82,
      metadata: { page_number: 2, file_name: 'bio.pdf' },
      material_id: 'm1',
    },
  ])
  assert(block)
  assert(block.includes('fotossíntese'))
  assert(block.includes('bio.pdf'))
  assert(block.includes('0.82'))
})

Deno.test('buildRagSystemPrompt: instrui uso exclusivo do material', () => {
  const prompt = buildRagSystemPrompt('Trecho 1: conteúdo')
  assert(prompt.includes('Broto'))
  assert(prompt.includes('Trecho 1: conteúdo'))
  assert(prompt.includes('não encontrou'))
})

Deno.test('buildRagChatMessages: system + histórico + pergunta', () => {
  const msgs = buildRagChatMessages({
    contextBlock: 'Trecho 1: clorofila',
    conversationHistory: [
      { role: 'assistant', content: 'Oi!' },
      { role: 'user', content: 'O que é fotossíntese?' },
    ],
    question: 'E a clorofila?',
  })
  assertEquals(msgs[0].role, 'system')
  assertEquals(msgs.at(-1)?.content, 'E a clorofila?')
})

Deno.test('RAG_NO_CONTEXT_REPLY: mensagem honesta definida', () => {
  assert(RAG_NO_CONTEXT_REPLY.includes('materiais'))
})
