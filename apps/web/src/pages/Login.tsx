import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Lock } from 'lucide-react'

const FIREFLIES = [
  { left: '10%', top: '20%', color: 'var(--green-400)', duration: '4s', delay: '0s' },
  { left: '80%', top: '15%', color: 'var(--gold-400)', duration: '5s', delay: '1s' },
  { left: '25%', top: '70%', color: 'var(--green-300)', duration: '3.5s', delay: '0.5s' },
  { left: '65%', top: '80%', color: 'var(--gold-300)', duration: '4.5s', delay: '2s' },
  { left: '50%', top: '40%', color: 'var(--green-400)', duration: '5.5s', delay: '1.5s' },
  { left: '90%', top: '55%', color: 'var(--green-300)', duration: '3.8s', delay: '0.8s' },
  { left: '15%', top: '85%', color: 'var(--gold-400)', duration: '4.2s', delay: '2.5s' },
]

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="broto-auth">
      {/* Fireflies */}
      {FIREFLIES.map((f, i) => (
        <div
          key={i}
          className="broto-firefly"
          style={{
            left: f.left,
            top: f.top,
            background: f.color,
            boxShadow: `0 0 8px ${f.color}`,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        />
      ))}

      <div className="broto-auth__card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="broto-auth__title">broto</h1>
          <p className="broto-auth__tagline">estude & floresça</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="broto-label" htmlFor="login-email">
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="login-email"
                className="broto-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div>
            <label className="broto-label" htmlFor="login-password">
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="login-password"
                className="broto-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          {error && <p className="broto-text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="broto-btn-primary"
            style={{ marginTop: 4 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          Ainda não tem conta?{' '}
          <Link to="/signup" className="broto-link-accent">
            Criar conta
          </Link>
        </p>
        <p
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <Link to="/inicio" className="broto-link-accent">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
