import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { trackMvpFunnelStep } from '@/lib/mvp-funnel'
import { User, Mail, Lock } from 'lucide-react'

const FIREFLIES = [
  { left: '15%', top: '25%', color: 'var(--green-400)', duration: '4.2s', delay: '0.3s' },
  { left: '75%', top: '10%', color: 'var(--gold-400)', duration: '5.1s', delay: '1.2s' },
  { left: '30%', top: '75%', color: 'var(--green-300)', duration: '3.8s', delay: '0.7s' },
  { left: '85%', top: '65%', color: 'var(--gold-300)', duration: '4.6s', delay: '1.8s' },
  { left: '45%', top: '35%', color: 'var(--green-400)', duration: '5.3s', delay: '0.5s' },
]

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password, nome)
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    trackMvpFunnelStep('signup_success')
    navigate('/onboarding')
  }

  return (
    <div className="broto-auth">
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
          <p className="broto-auth__subtitle">Criar conta</p>
          <p className="broto-auth__subtitle">Comece sua jornada no Broto</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="broto-label" htmlFor="signup-nome">
              Nome
            </label>
            <div style={{ position: 'relative' }}>
              <User
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
                id="signup-nome"
                className="broto-input"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Seu nome"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div>
            <label className="broto-label" htmlFor="signup-email">
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
                id="signup-email"
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
            <label className="broto-label" htmlFor="signup-password">
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
                id="signup-password"
                className="broto-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimo 6 caracteres"
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
            {loading ? 'Criando...' : 'Criar conta'}
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
          Já tem conta?{' '}
          <Link to="/login" className="broto-link-accent">
            Entrar
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
