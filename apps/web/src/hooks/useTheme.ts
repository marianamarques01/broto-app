import { useEffect } from 'react'

const THEME_STORAGE_KEY = 'broto-theme'

/** Aplicação web usa apenas tema escuro. */
export function useTheme() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
  }, [])

  return { theme: 'dark' as const }
}
