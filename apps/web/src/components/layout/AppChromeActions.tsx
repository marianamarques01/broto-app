import { usePet } from '@/hooks/usePet'
import { Bell, Flame } from 'lucide-react'

/**
 * Sequência e notificações no header mobile (XP removido do chrome).
 */
export function AppChromeActions() {
  const { pet } = usePet()
  const streak = pet?.streak ?? 0

  return (
    <div className="broto-app__chrome-actions" aria-label="Resumo e atalhos">
      <div className="broto-topbar__metrics" aria-label="Sequência">
        {streak > 0 ? (
          <span className="broto-streak-pill" title="Dias seguidos estudando">
            <Flame size={12} strokeWidth={2} aria-hidden />
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        ) : (
          <span
            className="broto-streak-pill broto-streak-pill--muted"
            title="Comece uma sequência hoje"
          >
            <Flame size={12} strokeWidth={2} aria-hidden />
            0 dias
          </span>
        )}
      </div>
      <button type="button" className="broto-topbar__icon-btn" aria-label="Notificações">
        <Bell size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}
