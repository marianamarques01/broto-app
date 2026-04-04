import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClasses } from '@/hooks/useClasses'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function CreateClass() {
  const navigate = useNavigate()
  const { createClass } = useClasses()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const { data, error } = await createClass({
      name: name.trim(),
      description: description.trim() || undefined,
    })

    setLoading(false)

    if (error) {
      setError(error)
      return
    }

    if (data) {
      navigate(`/classes/${data.id}`)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-void)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Nova turma" backTo="/" />

        <main style={{ padding: '24px 32px', flex: 1 }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: '32px 40px',
              maxWidth: 520,
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
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
                    background: 'var(--bg-deep)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
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
                    background: 'var(--bg-deep)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && <p style={{ color: 'var(--red-400)', fontSize: 13, margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
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
        </main>
      </div>
    </div>
  )
}
