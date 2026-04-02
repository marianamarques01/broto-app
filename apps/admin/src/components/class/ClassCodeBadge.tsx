type Props = {
  code: string
}

export function ClassCodeBadge({ code }: Props) {
  async function handleCopy() {
    await navigator.clipboard.writeText(code)
  }

  return (
    <button
      onClick={handleCopy}
      title="Clique para copiar"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--green-glow)',
        border: '1px solid var(--border-strong)',
        borderRadius: 6,
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'monospace',
        letterSpacing: 2,
        color: 'var(--green-400)',
        fontWeight: 500,
      }}
    >
      {code}
    </button>
  )
}
