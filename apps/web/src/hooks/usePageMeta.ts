import { useEffect } from 'react'

/** Alinhado ao <title> padrão em `index.html` */
export const DEFAULT_PAGE_TITLE = 'broto — estude & floresça'

export const DEFAULT_PAGE_DESCRIPTION =
  'Plataforma de estudos para o ENEM: questões por área, rotina de estudos e acompanhamento do progresso com inteligência e simplicidade.'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

type PageMetaOpts = {
  title: string
  description?: string
}

/** Atualiza título e meta (description + Open Graph básicas) durante a navegação SPA */
export function usePageMeta({ title, description }: PageMetaOpts): void {
  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description ?? DEFAULT_PAGE_DESCRIPTION)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description ?? DEFAULT_PAGE_DESCRIPTION)
  }, [title, description])
}
