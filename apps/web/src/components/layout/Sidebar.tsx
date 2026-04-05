import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home,
  BarChart3,
  CalendarCheck,
  MessageCircle,
  LogOut,
  GraduationCap,
  Library,
} from 'lucide-react'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/study', label: 'Área de Estudo', icon: GraduationCap },
  { path: '/study/questions', label: 'Banco de questões', icon: Library },
  { path: '/progress', label: 'Progresso', icon: BarChart3 },
  { path: '/routine', label: 'Rotina', icon: CalendarCheck },
  { path: '/broto', label: 'Broto AI', icon: MessageCircle },
]

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth()

  return (
    <aside className="broto-sidebar broto-sidebar--collapsible">
      <div className="broto-sidebar__brand">
        <NavLink
          to="/"
          end
          className="broto-sidebar__brand-link"
          aria-label="Broto — início"
          onClick={onNavigate}
        >
          <span className="broto-sidebar__brand-mark" aria-hidden>
            🌱
          </span>
          <div className="broto-sidebar__brand-text">
            <h1 className="broto-sidebar__brand-name">broto</h1>
            <p className="broto-sidebar__brand-tag">estude & floresça</p>
          </div>
        </NavLink>
      </div>

      <OrganizationSwitcher />

      <nav className="broto-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={
              item.path === '/' || item.path === '/study' || item.path === '/study/questions'
            }
            className={({ isActive }) =>
              `broto-sidebar__link${isActive ? ' broto-sidebar__link--active' : ''}`
            }
            onClick={onNavigate}
          >
            <item.icon size={20} className="broto-sidebar__link-icon" />
            <span className="broto-sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="broto-sidebar__footer">
        <p className="broto-sidebar__user">{user?.nome ?? user?.email}</p>
        <button type="button" onClick={signOut} className="broto-sidebar__signout">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
