/** Contagem de linhas no estilo folha ENEM (split por \\n). */
export function countLinhasRedacao(texto: string): number {
  if (!texto) return 0
  return texto.split('\n').length
}

/** Impede ultrapassar o limite de linhas da prova (30). */
export function clampLinhasRedacao(texto: string, maxLinhas = 30): string {
  const lines = texto.split('\n')
  if (lines.length <= maxLinhas) return texto
  return lines.slice(0, maxLinhas).join('\n')
}

export function linhaCountStatus(
  count: number,
): 'empty' | 'below_min' | 'valid' | 'at_max' | 'over_max' {
  if (count === 0) return 'empty'
  if (count < 7) return 'below_min'
  if (count > 30) return 'over_max'
  if (count === 30) return 'at_max'
  return 'valid'
}
