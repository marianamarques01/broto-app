/** Chunking de texto para RAG — lógica pura, testável sem rede. */

export type MaterialChunkMetadata = {
  page_number?: number
  section_title?: string
  file_name?: string
}

export type MaterialChunk = {
  text: string
  tokens?: number
  metadata?: MaterialChunkMetadata
}

export type MaterialChunkOptions = {
  targetTokens?: number
  overlapTokens?: number
  metadata?: MaterialChunkMetadata
  fileName?: string
}

export const DEFAULT_CHUNK_TARGET_TOKENS = 650
export const DEFAULT_CHUNK_OVERLAP_TOKENS = 80
const MIN_CHUNK_CHARS = 40

/** Estimativa ~4 chars/token (PT/EN). */
export function estimateTokenCount(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractMetaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    'i',
  )
  return html.match(re)?.[1]?.trim() ?? html.match(alt)?.[1]?.trim()
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return v
      const parts = parsed.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
    }
  } catch {
    return null
  }
  return null
}

function takeOverlapTail(text: string, overlapTokens: number): string {
  if (overlapTokens <= 0) return ''
  const words = text.trim().split(/\s+/)
  const wordBudget = Math.max(1, Math.ceil(overlapTokens * 0.75))
  return words.slice(-wordBudget).join(' ')
}

function splitLongText(text: string, targetTokens: number, overlapTokens: number): string[] {
  const sentences = text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const parts: string[] = []
  let buffer = ''

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence)
    if (sentenceTokens > targetTokens) {
      if (buffer) {
        parts.push(buffer.trim())
        buffer = ''
      }
      const words = sentence.split(/\s+/)
      let chunk = ''
      for (const word of words) {
        const next = chunk ? `${chunk} ${word}` : word
        if (estimateTokenCount(next) > targetTokens && chunk) {
          parts.push(chunk)
          chunk = `${takeOverlapTail(chunk, overlapTokens)} ${word}`.trim()
        } else {
          chunk = next
        }
      }
      if (chunk.trim()) parts.push(chunk.trim())
      continue
    }

    const next = buffer ? `${buffer} ${sentence}` : sentence
    if (estimateTokenCount(next) > targetTokens && buffer) {
      parts.push(buffer.trim())
      buffer = `${takeOverlapTail(buffer, overlapTokens)} ${sentence}`.trim()
    } else {
      buffer = next
    }
  }

  if (buffer.trim()) parts.push(buffer.trim())
  return parts
}

function baseMetadata(options: MaterialChunkOptions): MaterialChunkMetadata {
  return {
    ...options.metadata,
    ...(options.fileName ? { file_name: options.fileName } : {}),
  }
}

export function chunkPlainText(text: string, options: MaterialChunkOptions = {}): MaterialChunk[] {
  const targetTokens = options.targetTokens ?? DEFAULT_CHUNK_TARGET_TOKENS
  const overlapTokens = options.overlapTokens ?? DEFAULT_CHUNK_OVERLAP_TOKENS
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const meta = baseMetadata(options)
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const chunks: MaterialChunk[] = []
  let buffer = ''

  const flush = () => {
    const chunkText = buffer.trim()
    if (chunkText.length < MIN_CHUNK_CHARS && chunks.length > 0) {
      const prev = chunks[chunks.length - 1]
      prev.text = `${prev.text}\n\n${chunkText}`.trim()
      prev.tokens = estimateTokenCount(prev.text)
      buffer = ''
      return
    }
    if (!chunkText) return
    chunks.push({
      text: chunkText,
      tokens: estimateTokenCount(chunkText),
      metadata: { ...meta },
    })
    buffer = ''
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokenCount(para)
    if (paraTokens > targetTokens) {
      if (buffer) flush()
      for (const part of splitLongText(para, targetTokens, overlapTokens)) {
        chunks.push({
          text: part,
          tokens: estimateTokenCount(part),
          metadata: { ...meta },
        })
      }
      continue
    }

    const next = buffer ? `${buffer}\n\n${para}` : para
    if (estimateTokenCount(next) > targetTokens && buffer) {
      flush()
      buffer =
        `${takeOverlapTail(chunks[chunks.length - 1]?.text ?? '', overlapTokens)}\n\n${para}`.trim()
    } else {
      buffer = next
    }
  }

  if (buffer.trim()) flush()
  return chunks
}

export function chunkPageTexts(
  pages: Array<{ pageNumber: number; text: string }>,
  options: MaterialChunkOptions = {},
): MaterialChunk[] {
  const all: MaterialChunk[] = []
  for (const page of pages) {
    const pageText = page.text.trim()
    if (!pageText) continue
    const pageChunks = chunkPlainText(pageText, {
      ...options,
      metadata: {
        ...options.metadata,
        page_number: page.pageNumber,
      },
    })
    all.push(...pageChunks)
  }
  return all
}
