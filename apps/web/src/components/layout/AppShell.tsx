import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className={`broto-app${navOpen ? ' broto-app--nav-open' : ''}`}>
      <button
        type="button"
        className="broto-mobile-nav-toggle"
        aria-expanded={navOpen}
        aria-label={navOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setNavOpen((o) => !o)}
      >
        {navOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <button
        type="button"
        className="broto-app__nav-backdrop"
        aria-label="Fechar menu"
        tabIndex={-1}
        onClick={() => setNavOpen(false)}
      />
      <div className="broto-app__body">
        <Sidebar onNavigate={() => setNavOpen(false)} />
        <main className="broto-app__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
