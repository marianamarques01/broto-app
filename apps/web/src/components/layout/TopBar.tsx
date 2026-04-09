import { usePet } from '@/hooks/usePet'
import { useTheme } from '@/hooks/useTheme'
import { ChevronRight, Flame, Moon, Sparkles, Sun } from 'lucide-react'

export type StudyBreadcrumbParts = {
  area: string
  detail: string
}

export type TopBarProps = {
  title: string
  subtitle?: string
  /** Trecho contextual ao lado do título (referência v2). */
  studyBreadcrumb?: StudyBreadcrumbParts
  variant?: 'default' | 'study'
}

export function TopBar({ title, subtitle, studyBreadcrumb, variant = 'default' }: TopBarProps) {
  const { pet } = usePet()
  const { theme, toggleTheme } = useTheme()
  const streak = pet?.streak ?? 0
  const xpTotal = pet?.xp ?? 0
  const isStudy = variant === 'study'

  return (
    <header className={`broto-topbar${isStudy ? ' broto-topbar--study' : ''}`}>
      {isStudy ? (
        <div className="broto-topbar__study-lead">
          <div className="broto-topbar__study-lead-primary">
            <h2 className="broto-topbar__title">{title}</h2>
            {subtitle ? <p className="broto-topbar__subtitle broto-topbar__subtitle--study">{subtitle}</p> : null}
          </div>
          {studyBreadcrumb ? (
            <div className="broto-topbar__breadcrumb-inline">
              <span className="broto-topbar__breadcrumb-area">{studyBreadcrumb.area}</span>
              <ChevronRight size={12} className="broto-topbar__breadcrumb-chev" aria-hidden />
              <span className="broto-topbar__breadcrumb-detail">{studyBreadcrumb.detail}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="broto-topbar__head">
          <div className="broto-topbar__title-row">
            <h2 className="broto-topbar__title">{title}</h2>
          </div>
          {subtitle ? <p className="broto-topbar__subtitle">{subtitle}</p> : null}
        </div>
      )}
      <div className="broto-topbar__actions-cluster">
        {xpTotal > 0 ? (
          <span className="broto-xp-pill" title="XP total">
            <Sparkles size={14} aria-hidden />
            {xpTotal.toLocaleString('pt-BR')} XP
          </span>
        ) : null}
        {streak > 0 ? (
          <span className="broto-streak-pill" title="Dias seguidos estudando">
            <Flame size={14} aria-hidden />
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        ) : null}
        <button
          type="button"
          className="broto-topbar__icon-btn"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
