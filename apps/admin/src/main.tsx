import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { router } from '@/router'
import '@/styles/web-theme.css'
import '@/styles/broto-sidebar.css'
import '@/styles/admin-app.css'

const rootElement = document.documentElement
const storedTheme = window.localStorage.getItem('broto-admin-theme')
const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light'
rootElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  </StrictMode>,
)
