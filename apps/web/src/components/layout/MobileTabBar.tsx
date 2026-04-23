import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, CalendarCheck, GraduationCap, Home, MessageCircle } from 'lucide-react'

const TAB_ITEMS: {
  path: string
  label: string
  shortLabel: string
  icon: typeof Home
  end?: boolean
  center?: boolean
}[] = [
  { path: '/study', label: 'Área de estudo', shortLabel: 'Estudo', icon: GraduationCap },
  { path: '/progress', label: 'Progresso', shortLabel: 'Progresso', icon: BarChart3 },
  { path: '/', label: 'Início', shortLabel: 'Início', icon: Home, end: true, center: true },
  { path: '/routine', label: 'Rotina', shortLabel: 'Rotina', icon: CalendarCheck },
  { path: '/broto', label: 'Broto AI', shortLabel: 'Broto', icon: MessageCircle },
]

/** Barra inferior com entalhe suave no centro (SVG) + botão Início elevado. */
export function MobileTabBar() {
  const location = useLocation()

  function isStudyPathActive(): boolean {
    return (
      location.pathname === '/study' ||
      (location.pathname.startsWith('/study/') && !location.pathname.startsWith('/study/mock-exam'))
    )
  }

  return (
    <nav className="broto-mtab" aria-label="Navegação principal">
      <div className="broto-mtab__shell" aria-hidden>
        <svg
          className="broto-mtab__shape"
          viewBox="0 0 480 72"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="broto-mtab-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--broto-mtab-surface-top)" />
              <stop offset="100%" stopColor="var(--broto-mtab-surface-bot)" />
            </linearGradient>
            <linearGradient id="broto-mtab-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="var(--teal-500)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Topo com U suave: laterais altas (y pequeno), centro do entalhe mais fundo (y maior) */}
          <path
            className="broto-mtab__shape-path"
            fill="url(#broto-mtab-fill)"
            d="M0,72 L0,20 C0,8 10,5 22,5 L168,5 C184,5 194,12 204,22 C214,32 226,38 240,38 C254,38 266,32 276,22 C286,12 296,5 312,5 L458,5 C470,5 480,8 480,20 L480,72 Z"
          />
          <path
            className="broto-mtab__shape-edge"
            fill="none"
            stroke="url(#broto-mtab-stroke)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            d="M22,5 L168,5 C184,5 194,12 204,22 C214,32 226,38 240,38 C254,38 266,32 276,22 C286,12 296,5 312,5 L458,5"
          />
        </svg>
        <div className="broto-mtab__glow" />
      </div>
      <ul className="broto-mtab__list">
        {TAB_ITEMS.map((item) => {
          const isCenter = item.center
          return (
            <li
              key={item.path + String(item.end)}
              className={isCenter ? 'broto-mtab__item broto-mtab__item--center' : 'broto-mtab__item'}
            >
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => {
                  const studyActive = item.path === '/study' && isStudyPathActive()
                  const active = item.path === '/study' ? studyActive : isActive
                  const base = isCenter ? 'broto-mtab__link broto-mtab__link--home' : 'broto-mtab__link'
                  return active ? `${base} broto-mtab__link--active` : base
                }}
                aria-label={item.label}
              >
                <span className="broto-mtab__link-bg" aria-hidden />
                {isCenter ? (
                  <>
                    <span className="broto-mtab__home-shine" aria-hidden />
                    <item.icon
                      className="broto-mtab__icon broto-mtab__icon--home"
                      size={27}
                      strokeWidth={2.15}
                      aria-hidden
                    />
                  </>
                ) : (
                  <>
                    <item.icon className="broto-mtab__icon" size={23} strokeWidth={2} aria-hidden />
                    <span className="broto-mtab__label">{item.shortLabel}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
