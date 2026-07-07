import { assert, assertEquals, assertFalse } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  assertCorrecaoBlindSemNotasIa,
  stripCorrecaoIaScores,
} from '@broto/shared/redacao/calibracao.ts'
import type { RedacaoCorrecao } from '@broto/shared/types/redacao.ts'
import { parseRedacaoCalibracaoSubmitBody } from './redacao-calibracao-validation.ts'

const CORRECAO: RedacaoCorrecao = {
  id: '11111111-1111-4111-8111-111111111111',
  redacao_id: '22222222-2222-4222-8222-222222222222',
  nota_competencia_i: 120,
  nota_competencia_ii: 80,
  nota_competencia_iii: 160,
  nota_competencia_iv: 40,
  nota_competencia_v: 200,
  nota_total: 600,
  justificativa_i: 'segredo',
  justificativa_ii: 'segredo',
  justificativa_iii: 'segredo',
  justificativa_iv: 'segredo',
  justificativa_v: 'segredo',
  marcacoes_inline: [
    {
      start_offset: 0,
      end_offset: 1,
      trecho: 'a',
      tipo_problema: 'x',
      comentario: 'y',
      competencia: 'I',
    },
  ],
  fatores_zero: { detectado: false, motivos: [] },
  prompt_version: 'v1',
  modelo_usado: 'gpt-4o',
  rag_chunks_used: null,
  created_at: '2026-07-01T00:00:00Z',
}

Deno.test('stripCorrecaoIaScores — nota IA oculta na resposta cega', () => {
  const blind = stripCorrecaoIaScores(CORRECAO)
  assert(assertCorrecaoBlindSemNotasIa(blind as unknown as Record<string, unknown>))
  assertFalse('nota_competencia_i' in blind)
  assertFalse('justificativa_i' in blind)
  assertFalse('marcacoes_inline' in blind)
})

Deno.test('parseRedacaoCalibracaoSubmitBody — exige 5 notas válidas', () => {
  const ok = parseRedacaoCalibracaoSubmitBody({
    correcao_id: CORRECAO.id,
    nota_humana_i: 120,
    nota_humana_ii: 80,
    nota_humana_iii: 160,
    nota_humana_iv: 40,
    nota_humana_v: 200,
    comentario: 'ok',
  })
  assert(ok.ok)
  if (ok.ok) {
    assertEquals(ok.data.nota_humana_i, 120)
  }

  const bad = parseRedacaoCalibracaoSubmitBody({
    correcao_id: CORRECAO.id,
    nota_humana_i: 35,
    nota_humana_ii: 80,
    nota_humana_iii: 160,
    nota_humana_iv: 40,
    nota_humana_v: 200,
  })
  assertFalse(bad.ok)
})
