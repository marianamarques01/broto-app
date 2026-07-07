import {
  isValidCompetencia,
  isValidEixoTematico,
  isValidRepertorioTipo,
  validateCreateInput,
  validateUpdateInput,
} from './redacao-repertorio-validation.ts'

Deno.test('isValidRepertorioTipo aceita tipos canônicos', () => {
  if (!isValidRepertorioTipo('dica')) throw new Error('dica deveria ser válido')
  if (!isValidRepertorioTipo('repertorio')) throw new Error('repertorio deveria ser válido')
  if (isValidRepertorioTipo('invalido')) throw new Error('tipo inválido deveria falhar')
})

Deno.test('isValidEixoTematico e competencia', () => {
  if (!isValidEixoTematico('educacao')) throw new Error('eixo educacao')
  if (!isValidCompetencia('II')) throw new Error('competencia II')
  if (isValidCompetencia('VI')) throw new Error('competencia VI inválida')
})

Deno.test('validateCreateInput exige campos obrigatórios', () => {
  const missing = validateCreateInput({})
  if (missing.ok) throw new Error('deveria falhar sem campos')
  if (!missing.error.includes('tipo')) throw new Error('erro tipo')

  const ok = validateCreateInput({
    tipo: 'dica',
    titulo: 'Título',
    conteudo: 'Conteúdo',
    eixo_tematico: 'saude',
    competencia_alvo: 'III',
    tags: ['tag1'],
  })
  if (!ok.ok) throw new Error(`deveria passar: ${ok.error}`)
  if (ok.data.eixo_tematico !== 'saude') throw new Error('eixo')
})

Deno.test('validateUpdateInput exige id e ao menos um campo', () => {
  const noId = validateUpdateInput({ titulo: 'x' })
  if (noId.ok) throw new Error('sem id deveria falhar')

  const noFields = validateUpdateInput({ id: 'a1000001-0000-4000-8000-000000000001' })
  if (noFields.ok) throw new Error('sem campos deveria falhar')

  const ok = validateUpdateInput({
    id: 'a1000001-0000-4000-8000-000000000001',
    ativo: false,
  })
  if (!ok.ok) throw new Error(`deveria passar: ${ok.error}`)
  if (ok.data.ativo !== false) throw new Error('ativo')
})
