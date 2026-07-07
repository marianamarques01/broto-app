/** Chunking semântico da Cartilha INEP — unidades normativas, não janela fixa cega. */

import { chunkPlainText, estimateTokenCount, type MaterialChunk } from './material-chunking.ts'

export type EnemReferenceSection =
  | 'matriz_referencia'
  | 'fatores_zero'
  | 'estrutura_textual'
  | 'proposta_intervencao'
  | 'repertorio'

export type EnemCompetencia = 'I' | 'II' | 'III' | 'IV' | 'V'

export type EnemReferenceChunkMetadata = {
  section: EnemReferenceSection
  competencia?: EnemCompetencia | null
  criterio_nivel?: 0 | 40 | 80 | 120 | 160 | 200
  section_title?: string
  page_number?: number
}

export type EnemReferenceChunk = {
  text: string
  tokens?: number
  metadata: EnemReferenceChunkMetadata
}

export const ENEM_REFERENCE_MAX_SECTION_TOKENS = 800

const CRITERIO_NIVEL_RE =
  /\b(?:nota|nível|nivel|pontua[cç][aã]o|desempenho)\s*(?:de\s*)?(0|40|80|120|160|200)\b/gi

const COMPETENCIA_HEADING_RES: Array<{ pattern: RegExp; competencia: EnemCompetencia }> = [
  { pattern: /\bcompet[eê]ncia\s+(?:n[º°o.]+\s*)?v\b/i, competencia: 'V' },
  { pattern: /\bcompet[eê]ncia\s+(?:n[º°o.]+\s*)?iv\b/i, competencia: 'IV' },
  { pattern: /\bcompet[eê]ncia\s+(?:n[º°o.]+\s*)?iii\b/i, competencia: 'III' },
  { pattern: /\bcompet[eê]ncia\s+(?:n[º°o.]+\s*)?ii\b/i, competencia: 'II' },
  { pattern: /\bcompet[eê]ncia\s+(?:n[º°o.]+\s*)?i\b/i, competencia: 'I' },
]

type SectionKind = {
  section: EnemReferenceSection
  competencia: EnemCompetencia | null
  title: string
}

function detectSectionKind(heading: string): SectionKind {
  const h = heading.trim()
  const lower = h.toLowerCase()

  if (/fatores?\s+(de\s+)?anula|nota\s+zero|anula[cç][aã]o\s+(da\s+)?nota/.test(lower)) {
    return { section: 'fatores_zero', competencia: null, title: h }
  }
  if (/proposta\s+de\s+interven/.test(lower)) {
    return { section: 'proposta_intervencao', competencia: 'V', title: h }
  }
  if (/repert[oó]rio/.test(lower)) {
    return { section: 'repertorio', competencia: 'II', title: h }
  }
  if (/dissertativ|estrutura\s+textual|texto\s+dissertativ/.test(lower)) {
    return { section: 'estrutura_textual', competencia: 'II', title: h }
  }

  for (const marker of COMPETENCIA_HEADING_RES) {
    if (marker.pattern.test(h)) {
      return { section: 'matriz_referencia', competencia: marker.competencia, title: h }
    }
  }

  return { section: 'matriz_referencia', competencia: null, title: h }
}

function splitByHeadings(fullText: string): Array<{ heading: string; body: string }> {
  const normalized = fullText.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const headingPattern =
    /(?:^|\n)\s*((?:COMPET[EÊ]NCIA\s+(?:N[º°O.]+\s*)?(?:V|IV|III|II|I)\b|Fatores?\s+(?:de\s+)?anula[cç][aã]o[^\n]{0,40}|Nota\s+zero|Proposta\s+de\s+interven[cç][aã]o|Repert[oó]rio(?:\s+produtivo)?|(?:Estrutura\s+textual|Texto\s+dissertativ)[^\n]{0,80}))\s*(?:\n|$)/gi

  const matches = [...normalized.matchAll(headingPattern)]
  if (matches.length === 0) {
    return [{ heading: 'Documento', body: normalized }]
  }

  const sections: Array<{ heading: string; body: string }> = []
  const firstIndex = matches[0].index ?? 0
  if (firstIndex > 0) {
    const preamble = normalized.slice(0, firstIndex).trim()
    if (preamble) sections.push({ heading: 'Introdução', body: preamble })
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const start = (match.index ?? 0) + match[0].length
    const end =
      i + 1 < matches.length ? (matches[i + 1].index ?? normalized.length) : normalized.length
    const body = normalized.slice(start, end).trim()
    if (body) {
      sections.push({ heading: match[1].trim(), body })
    }
  }

  return sections
}

function parseCriterioNivel(block: string): 0 | 40 | 80 | 120 | 160 | 200 | undefined {
  const match = block.match(CRITERIO_NIVEL_RE)
  if (!match) return undefined
  const last = match[match.length - 1]
  const digits = last.match(/(0|40|80|120|160|200)/)?.[1]
  if (!digits) return undefined
  return Number(digits) as 0 | 40 | 80 | 120 | 160 | 200
}

function subdivideSection(
  text: string,
  baseMeta: EnemReferenceChunkMetadata,
): EnemReferenceChunk[] {
  const tokens = estimateTokenCount(text)
  if (tokens <= ENEM_REFERENCE_MAX_SECTION_TOKENS) {
    const criterio = baseMeta.section === 'matriz_referencia' ? parseCriterioNivel(text) : undefined
    return [
      {
        text: text.trim(),
        tokens,
        metadata: {
          ...baseMeta,
          ...(criterio !== undefined ? { criterio_nivel: criterio } : {}),
        },
      },
    ]
  }

  if (baseMeta.section === 'matriz_referencia') {
    const levelBlocks = text.split(
      /(?=\b(?:nota|nível|nivel|pontua[cç][aã]o|desempenho)\s*(?:de\s*)?(?:0|40|80|120|160|200)\b)/i,
    )
    if (levelBlocks.length > 1) {
      return levelBlocks
        .map((block) => block.trim())
        .filter(Boolean)
        .flatMap((block) => subdivideSection(block, baseMeta))
    }
  }

  const materialChunks: MaterialChunk[] = chunkPlainText(text, {
    targetTokens: ENEM_REFERENCE_MAX_SECTION_TOKENS,
    overlapTokens: 60,
    metadata: { section_title: baseMeta.section_title },
  })

  return materialChunks.map((chunk) => ({
    text: chunk.text,
    tokens: chunk.tokens,
    metadata: {
      ...baseMeta,
      ...(baseMeta.section === 'matriz_referencia'
        ? (() => {
            const criterio = parseCriterioNivel(chunk.text)
            return criterio !== undefined ? { criterio_nivel: criterio } : {}
          })()
        : {}),
    },
  }))
}

export function buildEnemReferenceChunksFromText(fullText: string): EnemReferenceChunk[] {
  const sections = splitByHeadings(fullText)
  const all: EnemReferenceChunk[] = []

  for (const section of sections) {
    const kind = detectSectionKind(section.heading)
    const baseMeta: EnemReferenceChunkMetadata = {
      section: kind.section,
      competencia: kind.competencia,
      section_title: kind.title,
    }
    all.push(...subdivideSection(section.body, baseMeta))
  }

  return all.filter((chunk) => chunk.text.trim().length >= 40)
}

export function buildEnemReferenceChunksFromPages(
  pages: Array<{ pageNumber: number; text: string }>,
): EnemReferenceChunk[] {
  const fullText = pages
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join('\n\n')
  const chunks = buildEnemReferenceChunksFromText(fullText)

  const pageByOffset = new Map<number, number>()
  let offset = 0
  for (const page of pages) {
    const text = page.text.trim()
    if (!text) continue
    pageByOffset.set(offset, page.pageNumber)
    offset += text.length + 2
  }

  return chunks.map((chunk) => {
    const idx = fullText.indexOf(chunk.text.slice(0, Math.min(80, chunk.text.length)))
    let page_number: number | undefined
    if (idx >= 0) {
      let best = 0
      for (const [start, page] of pageByOffset) {
        if (start <= idx && start >= best) {
          best = start
          page_number = page
        }
      }
    }
    return page_number !== undefined
      ? { ...chunk, metadata: { ...chunk.metadata, page_number } }
      : chunk
  })
}
