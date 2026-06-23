import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  chunkPageTexts,
  chunkPlainText,
  estimateTokenCount,
  extractMetaContent,
  extractYoutubeVideoId,
  stripHtml,
} from './material-chunking.ts'

Deno.test('estimateTokenCount: estima por tamanho', () => {
  assertEquals(estimateTokenCount(''), 0)
  assertEquals(estimateTokenCount('abcd'), 1)
  assertEquals(estimateTokenCount('a'.repeat(400)), 100)
})

Deno.test('stripHtml: remove tags e normaliza espaços', () => {
  const html = '<html><body><h1>Título</h1><p>Texto &amp; mais</p></body></html>'
  assertEquals(stripHtml(html), 'Título Texto & mais')
})

Deno.test('extractMetaContent: lê meta description', () => {
  const html = '<meta name="description" content="Resumo da página">'
  assertEquals(extractMetaContent(html, 'description'), 'Resumo da página')
})

Deno.test('extractYoutubeVideoId: suporta watch e youtu.be', () => {
  assertEquals(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assertEquals(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

Deno.test('chunkPlainText: divide parágrafos longos', () => {
  const para1 = 'Introdução. '.repeat(80)
  const para2 = 'Conclusão breve.'
  const chunks = chunkPlainText(`${para1}\n\n${para2}`, {
    targetTokens: 120,
    overlapTokens: 20,
    fileName: 'apostila.pdf',
  })
  assert(chunks.length >= 2)
  assertEquals(chunks[0].metadata?.file_name, 'apostila.pdf')
  assert((chunks[0].tokens ?? 0) <= 150)
})

Deno.test('chunkPageTexts: preserva page_number', () => {
  const chunks = chunkPageTexts(
    [
      { pageNumber: 1, text: 'Página um com conteúdo suficiente para chunk.' },
      { pageNumber: 2, text: 'Página dois com outro bloco de texto relevante.' },
    ],
    { fileName: 'livro.pdf' },
  )
  assert(chunks.length >= 2)
  assertEquals(chunks[0].metadata?.page_number, 1)
  assert(chunks.some((c) => c.metadata?.page_number === 2))
})

Deno.test('chunkPlainText: retorna vazio para texto em branco', () => {
  assertEquals(chunkPlainText('   '), [])
})
