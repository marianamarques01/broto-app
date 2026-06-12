import { Link } from 'react-router-dom'
import { Sparkles, Zap } from 'lucide-react'
import { getAreaColor, getAreaIcon } from '@/lib/area-config'
import type { RoutineSession } from '@/lib/routine-sessions'

interface RoutineSessionCardsProps {
  sessions: RoutineSession[]
}

function StatusPill({ session }: { session: RoutineSession }) {
  if (session.status === 'completed') {
    return (
      <span className="broto-routine-sess__pill broto-routine-sess__pill--done">Concluído</span>
    )
  }
  if (session.status === 'active') {
    return (
      <span className="broto-routine-sess__pill broto-routine-sess__pill--active">
        <span className="broto-routine-sess__dot" />
        Em andamento
      </span>
    )
  }
  return (
    <span className="broto-routine-sess__pill broto-routine-sess__pill--wait">
      {session.locked ? 'Bloqueado' : 'Pendente'}
    </span>
  )
}

export function RoutineSessionCards({ sessions }: RoutineSessionCardsProps) {
  if (sessions.length === 0) {
    return (
      <div className="broto-routine-empty" role="status">
        <div className="broto-routine-empty__glyph" aria-hidden>
          <Sparkles size={26} strokeWidth={2.25} />
        </div>
        <h3 className="broto-routine-empty__title">Nada agendado ainda</h3>
        <p className="broto-routine-empty__text">
          Quando o plano vier do servidor ou das missões, os blocos aparecem aqui. Enquanto isso,
          abra uma sessão rápida no banco para manter o ritmo.
        </p>
      </div>
    )
  }

  return (
    <ul className="broto-routine-sess-list">
      {sessions.map((s) => {
        const Icon = getAreaIcon(s.areaKey)
        const color = getAreaColor(s.areaKey)
        const muted = s.status === 'pending'
        const inner = (
          <>
            <span className="broto-routine-sess__time">{s.startLabel}</span>
            <div
              className="broto-routine-sess__icon"
              style={{
                background: `${color}22`,
                borderColor: `${color}44`,
              }}
            >
              <Icon size={20} style={{ color }} aria-hidden />
            </div>
            <div className="broto-routine-sess__body">
              <div className="broto-routine-sess__topic">{s.topicLabel}</div>
              <div className="broto-routine-sess__meta">
                <span style={{ color }}>{s.areaLabel}</span>
                <span className="broto-routine-sess__dot-sep">·</span>
                <span>{s.kindLabel}</span>
                <span className="broto-routine-sess__dot-sep">·</span>
                <span>{s.durationMin} min</span>
              </div>
            </div>
            <div className="broto-routine-sess__tail">
              {s.accuracyBadge ? (
                <span className="broto-routine-sess__acc" style={{ color }}>
                  {s.accuracyBadge}
                </span>
              ) : null}
              <StatusPill session={s} />
              {s.status === 'completed' ? (
                <span className="broto-routine-sess__xp">
                  <Zap size={12} strokeWidth={2.5} aria-hidden />+{s.xp} XP
                </span>
              ) : s.status === 'active' && !s.locked ? (
                <span className="broto-routine-sess__xp broto-routine-sess__xp--ghost">
                  <Zap size={12} strokeWidth={2.5} aria-hidden />+{s.xp} XP
                </span>
              ) : null}
            </div>
          </>
        )

        const className = [
          'broto-routine-sess',
          s.status === 'active' ? 'broto-routine-sess--active' : '',
          muted ? 'broto-routine-sess--muted' : '',
          s.locked ? 'broto-routine-sess--locked' : '',
        ]
          .filter(Boolean)
          .join(' ')

        if (s.locked) {
          return (
            <li key={s.id} className={className}>
              <div
                className="broto-routine-sess__locked-wrap"
                title="Conclua a sessão anterior primeiro"
              >
                {inner}
              </div>
            </li>
          )
        }

        return (
          <li key={s.id} className={className}>
            <Link to={`/study/${s.areaKey}`} className="broto-routine-sess__link">
              {inner}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
