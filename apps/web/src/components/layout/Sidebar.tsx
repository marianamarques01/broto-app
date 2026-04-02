import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Home, BookOpen, BarChart3, CalendarCheck, MessageCircle, LogOut, GraduationCap } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/study', label: 'Área de Estudo', icon: GraduationCap },
  // { path: '/study/questions', label: 'Questões', icon: BookOpen },
  { path: '/progress', label: 'Progresso', icon: BarChart3 },
  { path: '/routine', label: 'Rotina', icon: CalendarCheck },
  { path: '/broto', label: 'Broto AI', icon: MessageCircle },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="broto-sidebar">
      <div className="broto-sidebar__brand">
        <NavLink to="/" end className="broto-sidebar__brand-link" aria-label="Broto — início">
          <h1 className="broto-sidebar__brand-name">broto</h1>
          <p className="broto-sidebar__brand-tag">estude & floresça</p>
        </NavLink>
      </div>

      <nav className="broto-sidebar__nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/' || item.path === '/study'}
            className={({ isActive }) =>
              `broto-sidebar__link${isActive ? ' broto-sidebar__link--active' : ''}`
            }
          >
            <item.icon size={20} className="broto-sidebar__link-icon" />
            {item.label}
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
