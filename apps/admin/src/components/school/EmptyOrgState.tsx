type Props = {
  onManageClasses?: () => void
}

export function EmptyOrgState({ onManageClasses }: Props) {
  return (
    <div
      style={{
        padding: '28px 24px',
        borderRadius: 12,
        border: '1px dashed var(--border-default)',
        background: 'var(--bg-card)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--text-primary)',
        }}
      >
        Instituição ainda sem turmas com dados
      </p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Crie turmas, importe alunos via CSV e aguarde a primeira atividade. O ranking e os alertas
        aparecem aqui automaticamente.
      </p>
      {onManageClasses && (
        <button
          type="button"
          onClick={onManageClasses}
          style={{
            marginTop: 16,
            background: 'var(--green-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Ir para gestão de turmas
        </button>
      )}
    </div>
  )
}
