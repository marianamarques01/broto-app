import { Bell, ClipboardList, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Domingo da 1ª aplicação (referência única para o contador). */
const ENEM_2026_D1 = new Date(2026, 10, 8)

function getEnemCountdownLabel(): string | null {
  const days = Math.ceil((ENEM_2026_D1.getTime() - Date.now()) / 86400000)
  if (days < 0) return null
  if (days === 0) return 'ENEM 2026 · hoje'
  if (days === 1) return 'ENEM 2026 · falta 1 dia'
  return `ENEM 2026 · faltam ${days} dias`
}

interface HomeDashboardTopBarProps {
  greeting: string
  plantLine: string
  streak: number
  /** Âncora para scroll (?cta=primeiro-simulado) quando o CTA da primeira sessão não está na página. */
  mockExamAnchorId?: string
}

export function HomeDashboardTopBar({
  greeting,
  plantLine,
  streak,
  mockExamAnchorId,
}: HomeDashboardTopBarProps) {
  const enemLabel = getEnemCountdownLabel()

  return (
    <header className="broto-topbar broto-topbar--dashboard">
      <div className="broto-topbar__lead">
        <div className="broto-topbar__intro">
          <h2 className="broto-topbar__title">{greeting}</h2>
          <p className="broto-topbar__subtitle">{plantLine}</p>
        </div>
      </div>
      <div className="broto-topbar__actions">
        {enemLabel ? (
          <span
            className="broto-enem-pill"
            title="Contagem regressiva até a primeira prova (referência ENEM 2026)"
          >
            {enemLabel}
          </span>
        ) : null}
        <Link id={mockExamAnchorId} to="/study/mock-exam" className="broto-home-mock-pill">
          <ClipboardList size={16} strokeWidth={2} aria-hidden />
          Sessão ENEM
        </Link>
        <div className="broto-topbar__metrics" aria-label="Sequência">
          {streak > 0 ? (
            <span className="broto-streak-pill" title="Dias seguidos estudando">
              <Flame size={14} aria-hidden />
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </span>
          ) : (
            <span
              className="broto-streak-pill broto-streak-pill--muted"
              title="Comece uma sequência hoje"
            >
              <Flame size={14} aria-hidden />0 dias
            </span>
          )}
        </div>
        <button type="button" className="broto-topbar__icon-btn" aria-label="Notificações">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
