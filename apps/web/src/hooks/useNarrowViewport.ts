import { useEffect, useState } from 'react'

/** Igual ao breakpoint em que aparece `.broto-mtab` (`app.css` max-width 1024px). */
const MOBILE_WEB_MAX_PX = 1024

/**
 * Hook para layout “mobile tablet” na web (largura de janela, não navegador).
 */
export function useNarrowViewport(maxWidthPx = MOBILE_WEB_MAX_PX): boolean {
  const query = `(max-width: ${maxWidthPx}px)`

  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}
