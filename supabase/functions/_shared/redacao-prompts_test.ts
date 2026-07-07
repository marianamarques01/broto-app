import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  buildCompetenciaSystemPrompt,
  buildFatoresZeroSystemPrompt,
  REDACAO_PROMPT_VERSION,
} from './redacao-prompts.ts'

Deno.test('REDACAO_PROMPT_VERSION: versão auditável', () => {
  assertEquals(REDACAO_PROMPT_VERSION, 'redacao-correct-v1.0')
})

Deno.test('buildFatoresZeroSystemPrompt: inclui motivos canônicos e JSON', () => {
  const prompt = buildFatoresZeroSystemPrompt('--- trecho RAG ---')
  assert(prompt.includes('fuga_tema'))
  assert(prompt.includes('copia_motivadores'))
  assert(prompt.includes('"detectado": boolean'))
  assert(prompt.includes('--- trecho RAG ---'))
})

Deno.test('buildCompetenciaSystemPrompt: Competência V é estrutural, não política', () => {
  const promptV = buildCompetenciaSystemPrompt('V', null)
  assert(promptV.includes('ESTRUTURA'))
  assert(promptV.includes('agente'))
  assert(promptV.includes('NÃO penalize posição política'))

  const promptI = buildCompetenciaSystemPrompt('I', null)
  assert(!promptI.includes('NÃO penalize posição política'))
})
