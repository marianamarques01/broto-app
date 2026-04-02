import { useTheme } from '@/hooks/useTheme'
import { Bell, Flame, Moon, Sparkles, Sun } from 'lucide-react'

interface HomeDashboardTopBarProps {
  greeting: string
  plantLine: string
  xpTotal: number
  streak: number
}

export function HomeDashboardTopBar({
  greeting,
  plantLine,
  xpTotal,
  streak,
}: HomeDashboardTopBarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="broto-topbar broto-topbar--dashboard">
      <div className="broto-topbar__lead">
        <div className="broto-topbar__intro">
          <h2 className="broto-topbar__title">{greeting}</h2>
          <p className="broto-topbar__subtitle">{plantLine}</p>
        </div>
      </div>
      <div className="broto-topbar__actions">
        <div className="broto-topbar__metrics" aria-label="XP e sequência">
          <span className="broto-xp-pill" title="XP total">
            <Sparkles size={14} aria-hidden />
            {xpTotal.toLocaleString('pt-BR')} XP
          </span>
          {streak > 0 ? (
            <span className="broto-streak-pill" title="Dias seguidos estudando">
              <Flame size={14} aria-hidden />
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </span>
          ) : (
            <span className="broto-streak-pill broto-streak-pill--muted" title="Comece uma sequência hoje">
              <Flame size={14} aria-hidden />
              0 dias
            </span>
          )}
        </div>
        <button
          type="button"
          className="broto-topbar__icon-btn"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          className="broto-topbar__icon-btn"
          aria-label="Notificações"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
