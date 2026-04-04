import { useState, FormEvent } from 'react'
import type { Class } from '@broto/shared'

type Props = {
  onClose: () => void
  onCreate: (params: {
    name: string
    description?: string
  }) => Promise<{ data: Class | null; error: string | null }>
}

export function CreateClassModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Class | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const { data, error } = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
    })
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    setCreated(data)
  }

  const overlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  }

  const modalStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 16,
    padding: '32px 40px',
    width: 440,
    maxWidth: '90vw',
    color: 'var(--text-primary)',
  }

  if (created) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Turma criada!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Compartilhe o codigo abaixo com seus alunos para que possam entrar na turma.
          </p>
          <div
            style={{
              background: 'var(--green-glow)',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              padding: '20px',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Codigo de acesso
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: 6,
                color: 'var(--green-400)',
                margin: 0,
              }}
            >
              {created.access_code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: 'var(--green-600)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Ir para a turma
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Nova turma</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Nome da turma *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Turma ENEM Manha 2026"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Descricao (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Focada em Ciencias da Natureza e Matematica"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && <p style={{ color: 'var(--red-400)', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                borderRadius: 8,
                padding: '12px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                flex: 1,
                background: 'var(--green-600)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.7 : 1,
              }}
            >
              {loading ? 'Criando...' : 'Criar turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
