import { useState, FormEvent } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { OrgTeacherJoinResponse } from '@broto/shared'
import { api } from '@/lib/api-client'

export function Login() {
  const { signIn, admin, loading: authLoading, refreshProfile } = useAdminAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState(
    () => searchParams.get('invite')?.trim().toUpperCase() ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!authLoading && admin) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError)
      setLoading(false)
      return
    }

    const code = inviteCode.trim().toUpperCase()
    if (code) {
      try {
        await api.post<OrgTeacherJoinResponse>('org-teacher-join', { inviteCode: code })
        await refreshProfile()
      } catch (joinErr) {
        setError(
          joinErr instanceof Error
            ? joinErr.message
            : 'Login ok, mas falha ao aplicar convite de professor',
        )
        setLoading(false)
        return
      }
    }

    navigate('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-void)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '40px 48px',
          width: 400,
          maxWidth: '90vw',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Broto Admin</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
            Acesso exclusivo para administradores
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Código de convite (professor)
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Opcional — ex.: BRT042"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {error && <p style={{ color: 'var(--red-400)', fontSize: 13, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--green-600)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
