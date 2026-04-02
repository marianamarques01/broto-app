import { useCallback, useEffect, useState } from 'react'

type AdminTheme = 'light' | 'dark'

const THEME_KEY = 'broto-admin-theme'

function readInitialTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  const fromDataset = document.documentElement.dataset.theme
  return fromDataset === 'dark' ? 'dark' : 'light'
}

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(() => readInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
