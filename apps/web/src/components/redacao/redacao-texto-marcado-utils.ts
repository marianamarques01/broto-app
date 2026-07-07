import type { MarcacaoInline } from '@broto/shared'

export type TextoMarcadoSegment = {
  start: number
  end: number
  text: string
  marcacoes: MarcacaoInline[]
}

/** Divide o texto em segmentos contíguos com as marcações que os cobrem. */
export function buildTextoMarcadoSegments(
  texto: string,
  marcacoes: MarcacaoInline[],
): TextoMarcadoSegment[] {
  if (!texto.length) return []

  const valid = marcacoes.filter(
    (m) =>
      m.start_offset >= 0 &&
      m.end_offset > m.start_offset &&
      m.end_offset <= texto.length &&
      m.trecho.length > 0,
  )

  const points = new Set<number>([0, texto.length])
  for (const m of valid) {
    points.add(m.start_offset)
    points.add(m.end_offset)
  }

  const sorted = [...points].sort((a, b) => a - b)
  const segments: TextoMarcadoSegment[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!
    const end = sorted[i + 1]!
    if (start >= end) continue

    const covering = valid.filter((m) => m.start_offset <= start && m.end_offset >= end)
    segments.push({
      start,
      end,
      text: texto.slice(start, end),
      marcacoes: covering,
    })
  }

  return segments
}

export function marcacoesSignature(marcacoes: MarcacaoInline[]): string {
  return marcacoes
    .map((m) => `${m.start_offset}:${m.end_offset}:${m.competencia}:${m.tipo_problema}`)
    .join('|')
}
