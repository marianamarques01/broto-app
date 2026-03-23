import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { LogOut, Moon, Sun, Users } from 'lucide-react'

export function Sidebar() {
  const { admin, signOut } = useAdminAuth()
  const { theme, toggleTheme } = useAdminTheme()

  return (
    <aside className="broto-sidebar">
      <div className="broto-sidebar__brand">
        <h1 className="broto-sidebar__brand-name">broto</h1>
        <p className="broto-sidebar__brand-tag">painel administrativo</p>
      </div>

      <nav className="broto-sidebar__nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `broto-sidebar__link${isActive ? ' broto-sidebar__link--active' : ''}`
          }
        >
          <Users size={20} className="broto-sidebar__link-icon" />
          Turmas
        </NavLink>
      </nav>

      <div className="broto-sidebar__footer">
        <button
          type="button"
          onClick={toggleTheme}
          className="broto-sidebar__theme-toggle"
          title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </button>

        <p className="broto-sidebar__user">{admin?.full_name ?? admin?.email}</p>

        <button type="button" onClick={signOut} className="broto-sidebar__signout">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
