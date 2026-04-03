import type { Area } from '@broto/shared'
import { BookOpen } from 'lucide-react'
import { AREA_CONFIG } from '@/lib/area-config'

interface AreaSelectorProps {
  areas: Area[]
  selectedArea: string
  onSelectArea: (area: string) => void
}

export function AreaSelector({ areas, selectedArea, onSelectArea }: AreaSelectorProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {areas.map(area => {
        const active = selectedArea === area.value
        const config = AREA_CONFIG[area.value] ?? { color: '#888', icon: BookOpen }
        const Icon = config.icon
        return (
          <button
            key={area.id}
            type="button"
            onClick={() => onSelectArea(area.value)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              border: active
                ? `1.5px solid ${config.color}`
                : '1px solid var(--border-default)',
              background: active
                ? `linear-gradient(135deg, ${config.color}18, ${config.color}08)`
                : 'var(--bg-card)',
              color: active ? config.color : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              fontWeight: active ? 600 : 500,
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: active
                ? `0 0 20px ${config.color}15, 0 4px 12px rgba(0,0,0,0.2)`
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {/* Subtle glow on active */}
            {active && (
              <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${config.color}20, transparent 70%)`,
                pointerEvents: 'none',
              }} />
            )}

            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: active
                ? `${config.color}22`
                : `${config.color}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}>
              <Icon size={18} style={{ color: config.color }} />
            </div>

            <span style={{ position: 'relative', zIndex: 1 }}>{area.label}</span>
          </button>
        )
      })}
    </div>
  )
}
