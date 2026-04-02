import { usePet } from '@/hooks/usePet'
import { useTheme } from '@/hooks/useTheme'
import { Flame, Moon, Sun } from 'lucide-react'

export function TopBar({ title }: { title: string }) {
  const { pet } = usePet()
  const { theme, toggleTheme } = useTheme()
  const streak = pet?.streak ?? 0

  return (
    <header className="broto-topbar">
      <div className="broto-topbar__title-row">
        <h2 className="broto-topbar__title">{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="broto-topbar__icon-btn"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {streak > 0 && (
          <span className="broto-streak-pill" title="Dias seguidos estudando">
            <Flame size={14} />
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        )}
      </div>
    </header>
  )
}
