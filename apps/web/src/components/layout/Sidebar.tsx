import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home,
  CalendarCheck,
  MessageCircle,
  LogOut,
  GraduationCap,
  Settings,
  UserCircle,
} from 'lucide-react'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'

const NAV_ITEMS: {
  path: string
  label: string
  icon: typeof Home
  linkTitle?: string
}[] = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/study', label: 'Área de Estudo', icon: GraduationCap },
  { path: '/routine', label: 'Rotina', icon: CalendarCheck },
  {
    path: '/broto',
    label: 'Broto IA',
    icon: MessageCircle,
    linkTitle: 'Assistente de IA — funcionalidade ainda em desenvolvimento',
  },
]

const FOOTER_LINKS = [
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/profile', label: 'Perfil', icon: UserCircle },
] as const

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { signOut } = useAuth()
  const location = useLocation()

  function handleSignOut() {
    signOut()
    onNavigate?.()
  }

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

      <nav className="broto-sidebar__nav" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.linkTitle}
            className={({ isActive }) => {
              const studyActive =
                item.path === '/study' &&
                (location.pathname === '/study' ||
                  (location.pathname.startsWith('/study/') &&
                    !location.pathname.startsWith('/study/mock-exam')))
              const active = item.path === '/study' ? studyActive : isActive
              return `broto-sidebar__link${active ? ' broto-sidebar__link--active' : ''}`
            }}
            onClick={onNavigate}
          >
            <item.icon size={20} className="broto-sidebar__link-icon" />
            <span className="broto-sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <nav className="broto-sidebar__footer-nav" aria-label="Conta e sessão">
        {FOOTER_LINKS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `broto-sidebar__link${isActive ? ' broto-sidebar__link--active' : ''}`
            }
            onClick={onNavigate}
          >
            <item.icon size={20} className="broto-sidebar__link-icon" />
            <span className="broto-sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="broto-sidebar__link broto-sidebar__link--logout" onClick={handleSignOut}>
          <LogOut size={20} className="broto-sidebar__link-icon" aria-hidden />
          <span className="broto-sidebar__link-label">Logout</span>
        </button>
      </nav>
    </aside>
  )
}
