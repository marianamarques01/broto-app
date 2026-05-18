import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/styles/app.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { ClassProvider } from '@/contexts/ClassContext'
import { DesktopRecommendationBanner } from '@/components/layout/DesktopRecommendationBanner'
import { router } from '@/router'

document.documentElement.dataset.theme = 'dark'
window.localStorage.setItem('broto-theme', 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OrganizationProvider>
        <ClassProvider>
          <Fragment>
            <DesktopRecommendationBanner />
            <RouterProvider router={router} />
          </Fragment>
        </ClassProvider>
      </OrganizationProvider>
    </AuthProvider>
  </StrictMode>,
)
