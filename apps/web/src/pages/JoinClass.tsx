import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'
import { TopBar } from '@/components/layout/TopBar'
import { Users, CheckCircle2 } from 'lucide-react'

export function JoinClass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !code.trim()) return
    setLoading(true)
    setError(null)

    try {
      await api.post('/api/class-join', {
        access_code: code.trim().toUpperCase(),
      })

      setSuccess(true)
      timerRef.current = setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Erro ao entrar na turma. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <TopBar title="Entrar em uma turma" />

      <div className="broto-main-inner" style={{ maxWidth: 480 }}>
        <div className="broto-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Users size={20} style={{ color: 'var(--green-400)' }} />
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Insira o código compartilhado pelo seu professor para entrar na turma.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <input
              className="broto-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código da turma"
              required
              style={{
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                textAlign: 'center',
                letterSpacing: '0.2em',
                fontWeight: 600,
                padding: '16px',
              }}
            />

            {error && <p className="broto-text-error">{error}</p>}
            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--green-400)' }} />
                <span style={{ color: 'var(--green-400)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Entrou na turma com sucesso!
                </span>
              </div>
            )}

            <button type="submit" disabled={loading || success} className="broto-btn-primary">
              {loading ? 'Entrando...' : 'Entrar na turma'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
