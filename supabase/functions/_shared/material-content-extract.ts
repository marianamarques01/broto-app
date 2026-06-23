import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  chunkPageTexts,
  chunkPlainText,
  extractMetaContent,
  extractYoutubeVideoId,
  stripHtml,
  type MaterialChunk,
} from './material-chunking.ts'
import { fetchBytesForUrl, MAX_PDF_PAGES } from './material-storage-fetch.ts'

export type MaterialSourceType = 'pdf' | 'url' | 'youtube' | 'text'

export type ExtractedMaterialContent = {
  pages?: Array<{ pageNumber: number; text: string }>
  plainText: string
  fileName: string
}

export type MaterialForExtraction = {
  type: MaterialSourceType
  source_url: string
  title: string
}

export type ExtractMaterialOptions = {
  adminClient?: SupabaseClient
}

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname
    const base = path.split('/').filter(Boolean).pop()
    if (base) return decodeURIComponent(base)
  } catch {
    // ignore
  }
  return fallback
}

async function fetchWithLimit(url: string, adminClient?: SupabaseClient): Promise<ArrayBuffer> {
  return fetchBytesForUrl(url, adminClient)
}

async function extractPdfText(
  sourceUrl: string,
  title: string,
  adminClient?: SupabaseClient,
): Promise<ExtractedMaterialContent> {
  const buffer = await fetchWithLimit(sourceUrl, adminClient)
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text: pageTexts } = await extractText(pdf, { mergePages: false })
  const limitedPages = pageTexts.slice(0, MAX_PDF_PAGES)
  const pages = limitedPages
    .map((text, index) => ({ pageNumber: index + 1, text: text.trim() }))
    .filter((p) => p.text.length > 0)

  if (pages.length === 0) {
    throw new Error(
      'PDF sem texto extraível (pode ser scan/imagem). Tente um PDF com texto selecionável ou divida o arquivo.',
    )
  }

  if (pageTexts.length > MAX_PDF_PAGES) {
    console.warn(
      `[material-content-extract] PDF truncado: ${MAX_PDF_PAGES}/${pageTexts.length} páginas indexadas`,
    )
  }

  const plainText = pages
    .map((p) => p.text)
    .join('\n\n')
    .trim()
  return {
    pages,
    plainText,
    fileName: fileNameFromUrl(sourceUrl, `${title}.pdf`),
  }
}

async function extractUrlText(
  sourceUrl: string,
  title: string,
  adminClient?: SupabaseClient,
): Promise<ExtractedMaterialContent> {
  const buffer = await fetchWithLimit(sourceUrl, adminClient)
  const raw = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  const html = raw
  const stripped = stripHtml(html)
  const description =
    extractMetaContent(html, 'description') ?? extractMetaContent(html, 'og:description') ?? ''
  const plainText = [title, description, stripped].filter(Boolean).join('\n\n').trim()
  return {
    plainText,
    fileName: fileNameFromUrl(sourceUrl, title),
  }
}

async function extractYoutubeText(
  sourceUrl: string,
  title: string,
): Promise<ExtractedMaterialContent> {
  const videoId = extractYoutubeVideoId(sourceUrl)
  let description = ''
  if (videoId) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`,
      )
      if (oembedRes.ok) {
        const body = (await oembedRes.json()) as { title?: string; author_name?: string }
        description = [body.title, body.author_name ? `Canal: ${body.author_name}` : '']
          .filter(Boolean)
          .join('\n')
      }
    } catch {
      // fallback abaixo
    }
  }

  const plainText = [title, description, `URL: ${sourceUrl}`].filter(Boolean).join('\n\n').trim()
  return {
    plainText,
    fileName: videoId ? `${videoId}.youtube` : `${title}.youtube`,
  }
}

export async function extractMaterialContent(
  material: MaterialForExtraction,
  options: ExtractMaterialOptions = {},
): Promise<ExtractedMaterialContent> {
  const { adminClient } = options
  switch (material.type) {
    case 'text':
      return {
        plainText: material.source_url.trim(),
        fileName: material.title,
      }
    case 'pdf':
      return await extractPdfText(material.source_url, material.title, adminClient)
    case 'url':
      return await extractUrlText(material.source_url, material.title, adminClient)
    case 'youtube':
      return await extractYoutubeText(material.source_url, material.title)
    default:
      throw new Error(`Tipo de material não suportado: ${material.type}`)
  }
}

export function buildMaterialChunks(
  extracted: ExtractedMaterialContent,
  sectionTitle?: string,
): MaterialChunk[] {
  const metadata = sectionTitle ? { section_title: sectionTitle } : undefined
  if (extracted.pages && extracted.pages.length > 0) {
    return chunkPageTexts(extracted.pages, {
      fileName: extracted.fileName,
      metadata,
    })
  }
  return chunkPlainText(extracted.plainText, {
    fileName: extracted.fileName,
    metadata,
  })
}
