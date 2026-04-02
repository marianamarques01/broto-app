import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/styles/app.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ClassProvider } from '@/contexts/ClassContext'
import { router } from '@/router'

const rootElement = document.documentElement
const storedTheme = window.localStorage.getItem('broto-theme')
const initialTheme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light'
rootElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ClassProvider>
        <RouterProvider router={router} />
      </ClassProvider>
    </AuthProvider>
  </StrictMode>
)
