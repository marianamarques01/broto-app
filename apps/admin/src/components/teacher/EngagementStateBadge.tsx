import { ENGAGEMENT_STATE_LABELS, type StudentEngagementState } from '@broto/shared'

const STATE_META: Record<
  StudentEngagementState,
  { label: string; color: string; bg: string; border: string }
> = {
  engaged: {
    label: ENGAGEMENT_STATE_LABELS.engaged,
    color: 'var(--green-400)',
    bg: 'rgba(76, 175, 80, 0.12)',
    border: 'rgba(76, 175, 80, 0.35)',
  },
  at_risk: {
    label: ENGAGEMENT_STATE_LABELS.at_risk,
    color: 'var(--gold-600)',
    bg: 'rgba(245, 200, 66, 0.1)',
    border: 'rgba(245, 200, 66, 0.35)',
  },
  missing: {
    label: ENGAGEMENT_STATE_LABELS.missing,
    color: 'var(--red-400)',
    bg: 'rgba(248, 113, 113, 0.1)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
}

export function engagementStateMeta(state: StudentEngagementState) {
  return STATE_META[state]
}

export function EngagementStateBadge({ state }: { state: StudentEngagementState }) {
  const meta = STATE_META[state]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: meta.color,
        }}
      />
      {meta.label}
    </span>
  )
}
