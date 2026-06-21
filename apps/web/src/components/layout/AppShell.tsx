import { Outlet } from 'react-router-dom'
import { BrotoIaFab } from '@/components/broto/BrotoIaFab'
import { SentryErrorBoundary } from '@/components/layout/SentryErrorBoundary'
import { AppChromeActions } from './AppChromeActions'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <SentryErrorBoundary>
      <div className="broto-app">
        <header className="broto-app__chrome" aria-label="Navegação do app">
          <div className="broto-app__chrome-inner">
            <div className="broto-app__chrome-brand">
              <span className="broto-app__chrome-mark" aria-hidden>
                🌱
              </span>
              <span className="broto-app__chrome-title">broto</span>
            </div>
            <div className="broto-app__chrome-end">
              <AppChromeActions />
            </div>
          </div>
        </header>
        <div className="broto-app__body">
          <div className="broto-sidebar-rail">
            <Sidebar />
          </div>
          <main className="broto-app__main">
            <Outlet />
          </main>
        </div>
        <MobileTabBar />
        <BrotoIaFab />
      </div>
    </SentryErrorBoundary>
  )
}
