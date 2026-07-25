import { useState } from 'react'

type Props = {
  active: boolean
  onMark: () => Promise<void>
  onResolve: () => Promise<void>
}

export function FollowUpButton({ active, onMark, onResolve }: Props) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      if (active) {
        await onResolve()
      } else {
        await onMark()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleClick()}
      style={{
        flexShrink: 0,
        padding: '8px 12px',
        borderRadius: 8,
        border: active ? '1px solid var(--border-strong)' : '1px solid var(--green-600)',
        background: active ? 'transparent' : 'var(--green-600)',
        color: active ? 'var(--text-secondary)' : '#fff',
        fontSize: 12,
        fontWeight: 500,
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? '…' : active ? 'Resolver' : 'Acompanhar'}
    </button>
  )
}
