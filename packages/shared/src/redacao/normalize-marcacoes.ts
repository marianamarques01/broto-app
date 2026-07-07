import type { MarcacaoInline, RedacaoCompetencia } from '../types/redacao.ts'

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Verifica se start/end apontam para o trecho informado no texto. */
export function isMarcacaoOffsetValid(texto: string, marcacao: MarcacaoInline): boolean {
  const { start_offset, end_offset, trecho } = marcacao
  if (!trecho || start_offset < 0 || end_offset > texto.length || start_offset >= end_offset) {
    return false
  }

  const slice = texto.slice(start_offset, end_offset)
  return slice === trecho || normalizeWhitespace(slice) === normalizeWhitespace(trecho)
}

/** Busca trecho no texto — exato, case-insensitive, whitespace flexível, prefixo. */
export function findTrechoInTexto(
  texto: string,
  trecho: string,
): { start_offset: number; end_offset: number } | null {
  const trimmed = trecho.trim()
  if (!trimmed || !texto) return null

  let start = texto.indexOf(trimmed)
  if (start >= 0) {
    return { start_offset: start, end_offset: start + trimmed.length }
  }

  const lowerText = texto.toLowerCase()
  const lowerTrecho = trimmed.toLowerCase()
  start = lowerText.indexOf(lowerTrecho)
  if (start >= 0) {
    return { start_offset: start, end_offset: start + trimmed.length }
  }

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    const pattern = words.map((word) => escapeRegExp(word)).join('\\s+')
    const match = texto.match(new RegExp(pattern, 'i'))
    if (match && match.index !== undefined) {
      return { start_offset: match.index, end_offset: match.index + match[0].length }
    }
  }

  const prefixLen = Math.min(24, Math.max(8, Math.floor(trimmed.length * 0.5)))
  const prefix = trimmed.slice(0, prefixLen)
  start = lowerText.indexOf(prefix.toLowerCase())
  if (start >= 0) {
    const end = Math.min(texto.length, start + trimmed.length)
    return { start_offset: start, end_offset: end }
  }

  return null
}

export type MarcacaoInput = {
  start_offset?: number
  end_offset?: number
  trecho: string
  tipo_problema: string
  comentario: string
  competencia: RedacaoCompetencia
}

/** Corrige offsets inválidos via busca fuzzy do trecho no texto da redação. */
export function normalizeMarcacoes(texto: string, marcacoes: MarcacaoInput[]): MarcacaoInline[] {
  const normalized: MarcacaoInline[] = []

  for (const raw of marcacoes) {
    if (!raw.trecho?.trim()) continue

    const candidate: MarcacaoInline = {
      start_offset: raw.start_offset ?? -1,
      end_offset: raw.end_offset ?? -1,
      trecho: raw.trecho,
      tipo_problema: raw.tipo_problema,
      comentario: raw.comentario,
      competencia: raw.competencia,
    }

    if (isMarcacaoOffsetValid(texto, candidate)) {
      normalized.push(candidate)
      continue
    }

    const found = findTrechoInTexto(texto, raw.trecho)
    if (!found) continue

    normalized.push({
      ...candidate,
      start_offset: found.start_offset,
      end_offset: found.end_offset,
      trecho: texto.slice(found.start_offset, found.end_offset),
    })
  }

  return dedupeMarcacoes(normalized)
}

function dedupeMarcacoes(marcacoes: MarcacaoInline[]): MarcacaoInline[] {
  const seen = new Set<string>()
  const out: MarcacaoInline[] = []

  for (const m of marcacoes) {
    const key = `${m.start_offset}:${m.end_offset}:${m.competencia}:${m.tipo_problema}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }

  return out
}
