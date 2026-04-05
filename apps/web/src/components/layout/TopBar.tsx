import { usePet } from '@/hooks/usePet'
import { useTheme } from '@/hooks/useTheme'
import { ChevronRight, Flame, Moon, Sun } from 'lucide-react'

export type StudyBreadcrumbParts = {
  area: string
  detail: string
}

export type TopBarProps = {
  title: string
  /** Trecho contextual ao lado do título (referência v2). */
  studyBreadcrumb?: StudyBreadcrumbParts
  variant?: 'default' | 'study'
}

export function TopBar({ title, studyBreadcrumb, variant = 'default' }: TopBarProps) {
  const { pet } = usePet()
  const { theme, toggleTheme } = useTheme()
  const streak = pet?.streak ?? 0
  const isStudy = variant === 'study'

  return (
    <header className={`broto-topbar${isStudy ? ' broto-topbar--study' : ''}`}>
      {isStudy ? (
        <div className="broto-topbar__study-lead">
          <h2 className="broto-topbar__title">{title}</h2>
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
        </div>
      )}
      <div className="broto-topbar__actions-cluster">
        <button
          type="button"
          className="broto-topbar__icon-btn"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {streak > 0 ? (
          <span className="broto-streak-pill" title="Dias seguidos estudando">
            <Flame size={14} aria-hidden />
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        ) : null}
      </div>
    </header>
  )
}
