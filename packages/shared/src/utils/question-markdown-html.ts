/**
 * Converte Markdown leve nos campos de questão (context/title) para HTML seguro de exibição:
 * - ![alt](url) → <img src="..." alt="..." />
 * - quebras de linha → <br />
 */
export function questionFieldMarkdownToHtml(input: string | null | undefined): string | null {
  if (input == null) return null
  const t = String(input)
  if (t.trim() === '') return null
  return t
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\n/g, '<br />')
}

/** Indica se o resultado deve ser renderizado como HTML (img/br), em vez de texto puro. */
export function questionFieldNeedsHtmlRendering(html: string | null): boolean {
  if (!html) return false
  return /<(img|br)\b/i.test(html)
}
