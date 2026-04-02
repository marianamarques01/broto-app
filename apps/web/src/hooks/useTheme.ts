import { useCallback, useEffect, useState } from 'react'

type BrotoTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'broto-theme'

function getThemeFromEnvironment(): BrotoTheme {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

  const datasetTheme = document.documentElement.dataset.theme
  return datasetTheme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<BrotoTheme>(() => getThemeFromEnvironment())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
