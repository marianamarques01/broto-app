import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import { useNarrowViewport } from '@/hooks/useNarrowViewport'

const STORAGE_KEY = 'broto-dismiss-desktop-recommendation'

export function DesktopRecommendationBanner() {
  const narrow = useNarrowViewport()

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignorar modo privado / storage bloqueado
    }
    setDismissed(true)
  }, [])

  if (!narrow || dismissed) return null

  return (
    <div className="broto-mobile-desktop-tip" role="status" aria-live="polite">
      <p className="broto-mobile-desktop-tip__text">
        Para uma experiência mais confortável, recomendamos usar o Broto no computador. No celular
        funciona, mas nem tudo está otimizado para telas pequenas.
      </p>
      <button
        type="button"
        className="broto-mobile-desktop-tip__close"
        onClick={onDismiss}
        aria-label="Fechar aviso sobre uso no desktop"
      >
        <X size={18} aria-hidden strokeWidth={2.25} />
      </button>
    </div>
  )
}
