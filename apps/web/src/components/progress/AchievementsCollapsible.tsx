import { useState, type CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, ChevronDown, Lock } from 'lucide-react'

export interface AchievementRow {
  id: string
  label: string
  desc: string
  icon: LucideIcon
  color: string
  unlocked: boolean
}

interface AchievementsCollapsibleProps {
  achievements: AchievementRow[]
  initialVisible?: number
}

export function AchievementsCollapsible({
  achievements,
  initialVisible = 4,
}: AchievementsCollapsibleProps) {
  const [open, setOpen] = useState(false)
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const visible = open ? achievements : achievements.slice(0, initialVisible)
  const hiddenCount = Math.max(0, achievements.length - initialVisible)
  const progressPct =
    achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0

  return (
    <section
      id="conquistas"
      className="broto-prog-card broto-prog-card--surface broto-progress-achievements broto-progress-anchor"
      aria-labelledby="progress-achievements-title"
    >
      <div className="broto-prog-card-head broto-prog-achievements-head">
        <div className="broto-prog-achievements-head-main">
          <h2
            id="progress-achievements-title"
            className="broto-prog-card-title broto-prog-achievements-title"
          >
            Conquistas
          </h2>
        </div>
        <span
          className="broto-prog-achievements-count-pill"
          aria-label={`${unlockedCount} de ${achievements.length} conquistas desbloqueadas`}
        >
          <span className="broto-prog-achievements-count-pill__val">{unlockedCount}</span>
          <span className="broto-prog-achievements-count-pill__sep">/</span>
          <span className="broto-prog-achievements-count-pill__max">{achievements.length}</span>
        </span>
      </div>
      <div
        className="broto-prog-achievements-track"
        role="progressbar"
        aria-valuenow={unlockedCount}
        aria-valuemin={0}
        aria-valuemax={achievements.length}
        aria-label="Progresso das conquistas"
      >
        <div className="broto-prog-achievements-track-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="broto-prog-achievements">
        {visible.map((a) => {
          const Icon = a.icon
          return (
            <div
              key={a.id}
              className={`broto-prog-achievement${a.unlocked ? ' broto-prog-achievement--unlocked' : ' broto-prog-achievement--locked'}`}
              style={{ '--ach-accent': a.color } as CSSProperties}
            >
              <div className="broto-prog-achievement-icon" aria-hidden>
                <Icon size={18} strokeWidth={a.unlocked ? 2 : 1.75} />
              </div>
              <div className="broto-prog-achievement-info">
                <span className="broto-prog-achievement-name">{a.label}</span>
                <span className="broto-prog-achievement-desc">{a.desc}</span>
              </div>
              {a.unlocked ? (
                <CheckCircle2 size={17} className="broto-prog-achievement-check" aria-hidden />
              ) : (
                <Lock
                  size={14}
                  className="broto-prog-achievement-lock"
                  aria-hidden
                  strokeWidth={2}
                />
              )}
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="broto-progress-achievements-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Mostrar menos' : `Ver todas (${achievements.length})`}
          <ChevronDown
            size={16}
            className={`broto-progress-achievements-toggle__icon${open ? ' broto-progress-achievements-toggle__icon--open' : ''}`}
            aria-hidden
          />
        </button>
      ) : null}
    </section>
  )
}
