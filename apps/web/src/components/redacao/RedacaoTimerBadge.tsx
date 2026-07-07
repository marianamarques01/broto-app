import { Clock } from 'lucide-react'
import { formatTimer } from './redacao-editor-utils'

export type RedacaoTimerBadgeProps = {
  timerEnabled: boolean
  onTimerEnabledChange: (enabled: boolean) => void
  secondsLeft: number
}

export function RedacaoTimerBadge({
  timerEnabled,
  onTimerEnabledChange,
  secondsLeft,
}: RedacaoTimerBadgeProps) {
  return (
    <label className="broto-rx-timer-badge">
      <input
        type="checkbox"
        checked={timerEnabled}
        onChange={(event) => onTimerEnabledChange(event.target.checked)}
      />
      <Clock size={15} aria-hidden />
      <span className="broto-rx-timer-badge__label">90 min</span>
      {timerEnabled ? (
        <span
          className={`broto-rx-timer-badge__value${secondsLeft <= 600 ? ' broto-rx-timer-badge__value--warn' : ''}`}
          aria-live="polite"
        >
          {formatTimer(secondsLeft)}
        </span>
      ) : null}
    </label>
  )
}
