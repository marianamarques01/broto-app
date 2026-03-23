import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Clock, Users } from 'lucide-react'

const HORAS_OPTIONS = [1, 2, 3, 4, 5]

export function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dataEnem, setDataEnem] = useState('')
  const [horasPorDia, setHorasPorDia] = useState(2)
  const [classCode, setClassCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          data_enem: dataEnem || null,
          horas_disponiveis_por_dia: horasPorDia,
          onboarding_done: true,
        })
        .eq('id', user.id)

      if (updateErr) throw updateErr

      if (classCode.trim()) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('code', classCode.trim().toUpperCase())
          .single()

        if (classData) {
          await supabase.from('enrollments').upsert({
            user_id: user.id,
            class_id: classData.id,
          })
          await supabase
            .from('users')
            .update({ current_class_id: classData.id })
            .eq('id', user.id)
        }
      }

      navigate('/')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="broto-auth">
      <div className="broto-auth__card broto-auth__card--wide">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="broto-auth__logo" aria-hidden>
            {'\u{1F331}'}
          </div>
          <h1 className="broto-auth__title">
            Bem-vindo, {user?.nome?.split(' ')[0]}!
          </h1>
          <p className="broto-auth__subtitle">
            Vamos configurar seu plano de estudos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="broto-label" htmlFor="onboarding-date" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} />
              Quando é sua prova do ENEM?
            </label>
            <input
              id="onboarding-date"
              className="broto-input"
              type="date"
              value={dataEnem}
              onChange={e => setDataEnem(e.target.value)}
            />
          </div>

          <div>
            <label className="broto-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} />
              Quantas horas por dia você pode estudar?
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {HORAS_OPTIONS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorasPorDia(h)}
                  className={`broto-hour-pill${horasPorDia === h ? ' broto-hour-pill--active' : ''}`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="broto-label" htmlFor="onboarding-class" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} />
              Código da turma (opcional)
            </label>
            <input
              id="onboarding-class"
              className="broto-input"
              type="text"
              value={classCode}
              onChange={e => setClassCode(e.target.value)}
              placeholder="Ex.: ENEM2025"
              style={{ textTransform: 'uppercase' }}
            />
            <p style={{ fontSize: '0.7rem', margin: '8px 0 0', color: 'var(--text-muted)' }}>
              Se seu professor compartilhou um código, insira aqui
            </p>
          </div>

          {error && <p className="broto-text-error">{error}</p>}

          <button type="submit" disabled={loading} className="broto-btn-primary">
            {loading ? 'Salvando...' : 'Começar'}
          </button>
        </form>
      </div>
    </div>
  )
}
