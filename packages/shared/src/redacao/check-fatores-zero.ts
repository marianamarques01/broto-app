import { REDACAO_FATORES_ZERO, type FatoresZero, type RedacaoFatorZero } from '../types/redacao.ts'

export type FatoresZeroLlmInput = {
  detectado?: boolean
  motivos?: string[]
  detalhes?: string
}

const FATOR_ZERO_SET = new Set<string>(REDACAO_FATORES_ZERO)

function isRedacaoFatorZero(value: string): value is RedacaoFatorZero {
  return FATOR_ZERO_SET.has(value)
}

/** Filtra motivos desconhecidos e deduplica preservando ordem. */
export function normalizeFatoresZeroMotivos(motivos: string[] | undefined): RedacaoFatorZero[] {
  if (!motivos?.length) return []

  const seen = new Set<RedacaoFatorZero>()
  const out: RedacaoFatorZero[] = []

  for (const raw of motivos) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!isRedacaoFatorZero(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }

  return out
}

/** Normaliza payload de fatores zero vindo da LLM ou do pipeline determinístico. */
export function normalizeFatoresZero(input: FatoresZeroLlmInput | FatoresZero): FatoresZero {
  const motivos = normalizeFatoresZeroMotivos(input.motivos)
  const detectado = input.detectado === true && motivos.length > 0
  const detalhes =
    typeof input.detalhes === 'string' && input.detalhes.trim() ? input.detalhes.trim() : undefined

  return {
    detectado,
    motivos,
    ...(detalhes ? { detalhes } : {}),
  }
}

/**
 * Checagem determinística antes da LLM: texto com menos de 7 linhas → nota zero.
 * Retorna null quando não há fator zero por linha_count.
 */
export function checkLinhaCountZeroFactor(linhaCount: number): FatoresZero | null {
  if (!Number.isFinite(linhaCount) || linhaCount >= 7) return null

  return {
    detectado: true,
    motivos: ['texto_curto'],
    detalhes: `Texto com ${linhaCount} linha(s) — mínimo exigido pelo ENEM: 7 linhas.`,
  }
}

/** Mescla múltiplas fontes de fatores zero (determinístico + LLM). */
export function mergeFatoresZero(
  ...sources: Array<FatoresZero | FatoresZeroLlmInput | null | undefined>
): FatoresZero {
  const motivos: RedacaoFatorZero[] = []
  const seen = new Set<RedacaoFatorZero>()
  const detalhesParts: string[] = []

  for (const source of sources) {
    if (!source) continue
    const normalized = normalizeFatoresZero(source)
    for (const motivo of normalized.motivos) {
      if (seen.has(motivo)) continue
      seen.add(motivo)
      motivos.push(motivo)
    }
    if (normalized.detalhes) detalhesParts.push(normalized.detalhes)
  }

  return {
    detectado: motivos.length > 0,
    motivos,
    ...(detalhesParts.length > 0 ? { detalhes: detalhesParts.join(' ') } : {}),
  }
}
