type Variant = 'no_students' | 'no_activity' | 'insufficient_data'

type Props = {
  variant: Variant
  accessCode?: string
}

const COPY: Record<Variant, { title: string; body: string }> = {
  no_students: {
    title: 'Turma ainda sem alunos matriculados',
    body: 'Quando os alunos entrarem pelo código da turma, o engajamento aparece aqui.',
  },
  no_activity: {
    title: 'Nenhuma atividade registrada ainda',
    body: 'Os alunos estão matriculados, mas ainda não responderam questões. Compartilhe o código da turma para começar.',
  },
  insufficient_data: {
    title: 'Dados ainda insuficientes para análise',
    body: 'Com mais sessões de prática, os sinais de engajamento e habilidades fracas ficarão mais precisos.',
  },
}

export function EmptyClassState({ variant, accessCode }: Props) {
  const copy = COPY[variant]

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
        {copy.title}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {copy.body}
      </p>
      {accessCode && variant === 'no_students' && (
        <p
          style={{
            margin: '16px 0 0',
            fontFamily: 'monospace',
            fontSize: 18,
            letterSpacing: 4,
            color: 'var(--green-400)',
            fontWeight: 600,
          }}
        >
          {accessCode}
        </p>
      )}
    </div>
  )
}

export function resolveEmptyClassVariant(
  totalStudents: number,
  active7dCount: number,
  hasPerformanceData: boolean,
): Variant | null {
  if (totalStudents === 0) return 'no_students'
  if (active7dCount === 0) return 'no_activity'
  if (!hasPerformanceData) return 'insufficient_data'
  return null
}
