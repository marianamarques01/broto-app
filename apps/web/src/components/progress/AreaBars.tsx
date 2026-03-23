import type { AreaStat } from '@/hooks/useProgress'
import { BookOpen, ChevronRight } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

interface AreaBarsProps {
  areas: AreaStat[]
  loading: boolean
}

function ProgressRing({ pct, color, size = 48, stroke = 4 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (c * Math.min(pct, 100)) / 100

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${color}50)` }}
      />
    </svg>
  )
}

export function AreaBars({ areas, loading }: AreaBarsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {areas.map(area => {
        const config = AREA_CONFIG[area.value] ?? { color: '#888', icon: BookOpen }
        const Icon = config.icon
        const pct = loading ? 0 : area.accuracyPct
        const hasData = !loading && area.totalAnswered > 0

        return (
          <div key={area.value} className="broto-card" style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
              <ProgressRing pct={hasData ? pct : 0} color={config.color} />
              <span style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: hasData ? config.color : 'var(--text-muted)',
              }}>
                {hasData ? `${pct}` : '—'}
              </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} style={{ color: config.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {area.label}
                </span>
              </div>
              {hasData && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                  {area.totalCorrect}/{area.totalAnswered} acertos
                </span>
              )}
            </div>

            <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
          </div>
        )
      })}
    </div>
  )
}
