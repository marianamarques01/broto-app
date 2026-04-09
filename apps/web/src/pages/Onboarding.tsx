import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useClass } from '@/hooks/useClass'
import { refreshUser } from '@/hooks/useUser'
import { api } from '@/lib/api-client'
import { formatMockExamFlowError } from '@/lib/mock-exam-flow-error'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import {
  buildMockExamPayload,
  fetchMockExamQuestions,
  loadMockExamPool,
  type StudentMockExamConfig,
} from '@broto/shared'
import {
  GraduationCap,
  Target,
  BarChart3,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  BookOpen,
  Globe2,
  FlaskConical,
  Calculator,
  Brain,
  Check,
  Loader2,
} from 'lucide-react'

/* ── Constants ──────────────────────────────────────────── */

const TOTAL_STEPS = 6

/** Simulado diagnóstico pós-onboarding: 20 questões, 5 por área (valores = `areas.json` / `details.discipline`). */
const ONBOARDING_DIAGNOSTIC_MOCK_CFG: StudentMockExamConfig = {
  nQuestoes: 20,
  randomMode: false,
  areaValues: ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'],
  topicoValues: [],
  years: [],
  language: '',
  expandLinguagensIdiomas: false,
}

const CURSOS_POPULARES = [
  'Medicina',
  'Direito',
  'Engenharia',
  'Psicologia',
  'Administracao',
  'Enfermagem',
  'Arquitetura',
  'Ciencia da Computacao',
] as const

const NOTAS_REFERENCIA = [
  { curso: 'Medicina', nota: 780 },
  { curso: 'Direito', nota: 720 },
  { curso: 'Engenharia', nota: 700 },
  { curso: 'Psicologia', nota: 660 },
  { curso: 'Administracao', nota: 620 },
  { curso: 'Pedagogia', nota: 580 },
] as const

type NivelArea = 'iniciante' | 'intermediario' | 'avancado'
type Horario = 'manha' | 'tarde' | 'noite'

const AREAS = [
  { key: 'linguagens', label: 'Linguagens', cssVar: '--area-linguagens', Icon: BookOpen },
  { key: 'humanas', label: 'Ciencias Humanas', cssVar: '--area-humanas', Icon: Globe2 },
  { key: 'natureza', label: 'Ciencias da Natureza', cssVar: '--area-natureza', Icon: FlaskConical },
  { key: 'matematica', label: 'Matematica', cssVar: '--area-matematica', Icon: Calculator },
] as const

const NIVEIS: { value: NivelArea; label: string; dots: number }[] = [
  { value: 'iniciante', label: 'Iniciante', dots: 1 },
  { value: 'intermediario', label: 'Intermediario', dots: 2 },
  { value: 'avancado', label: 'Avancado', dots: 3 },
]

const HORAS_OPTIONS = [1, 2, 3, 4, 5] as const

const HORARIOS: { value: Horario; label: string; Icon: typeof Sun }[] = [
  { value: 'manha', label: 'Manha', Icon: Sun },
  { value: 'tarde', label: 'Tarde', Icon: Sunset },
  { value: 'noite', label: 'Noite', Icon: Moon },
]

/* ── Types ──────────────────────────────────────────────── */

interface OnboardingState {
  faculdade: string
  curso: string
  metaNota: number
  niveis: Record<string, NivelArea | null>
  horasPorDia: number
  horarios: Horario[]
}

/* ── Helpers ────────────────────────────────────────────── */

function getNotaColor(nota: number): string {
  if (nota < 550) return 'var(--text-muted)'
  if (nota < 700) return 'var(--green-500)'
  if (nota < 800) return 'var(--gold-500)'
  return 'var(--area-matematica)'
}

/* ── Shared Components ──────────────────────────────────── */

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="onb-progress">
      <div className="onb-progress__fill" style={{ width: `${(current / total) * 100}%` }} />
    </div>
  )
}

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="onb-step-header">
      <div className="onb-step-header__icon">{icon}</div>
      <h2 className="onb-step-header__title">{title}</h2>
      <p className="onb-step-header__subtitle">{subtitle}</p>
    </div>
  )
}

/* ── Step 0: Welcome ────────────────────────────────────── */

function StepWelcome({
  nome,
  onContinue,
  onSkipAll,
}: {
  nome: string
  onContinue: () => void
  onSkipAll: () => void
}) {
  return (
    <div className="onb-welcome">
      <h1 className="broto-auth__title">broto</h1>
      <h1 className="onb-welcome__title">
        Vamos personalizar seus estudos{nome ? `, ${nome}` : ''}!
      </h1>
      <p className="onb-welcome__subtitle">
        Sao algumas perguntas rapidas para montar seu plano ideal.
      </p>
      <button onClick={onContinue} className="broto-btn-primary" style={{ marginTop: 24 }}>
        Vamos la!
      </button>
      <button onClick={onSkipAll} className="onb-skip-all">
        Pular configuracao
      </button>
    </div>
  )
}

/* ── Step 1: Objetivo ───────────────────────────────────── */

function StepObjetivo({
  data,
  onChange,
}: {
  data: OnboardingState
  onChange: (d: Partial<OnboardingState>) => void
}) {
  return (
    <div className="onb-step-body">
      <StepHeader
        icon={<GraduationCap size={24} />}
        title="Qual seu objetivo?"
        subtitle="Saber o curso ajuda a focar no que importa"
      />

      <div className="onb-field">
        <label className="broto-label">Faculdade desejada</label>
        <input
          className="broto-input"
          value={data.faculdade}
          onChange={(e) => onChange({ faculdade: e.target.value })}
          placeholder="Ex: USP, UFMG, UNICAMP..."
        />
        <p className="onb-hint">Opcional — pode deixar em branco</p>
      </div>

      <div className="onb-field">
        <label className="broto-label">Curso desejado</label>
        <input
          className="broto-input"
          value={data.curso}
          onChange={(e) => onChange({ curso: e.target.value })}
          placeholder="Ex: Medicina, Direito..."
        />
      </div>

      <div className="onb-field">
        <label className="broto-label">Cursos populares</label>
        <div className="onb-chips">
          {CURSOS_POPULARES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ curso: c })}
              className={`onb-chip${data.curso === c ? ' onb-chip--active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Step 2: Meta de Nota ───────────────────────────────── */

function StepMeta({
  data,
  onChange,
}: {
  data: OnboardingState
  onChange: (d: Partial<OnboardingState>) => void
}) {
  const notaColor = getNotaColor(data.metaNota)
  const highlightCurso = data.curso

  return (
    <div className="onb-step-body">
      <StepHeader
        icon={<Target size={24} />}
        title="Qual sua meta de nota?"
        subtitle="A nota media do ENEM e 500"
      />

      <div className="onb-meta-display">
        <span className="onb-meta-number" style={{ color: notaColor }}>
          {data.metaNota}
        </span>
        <span className="onb-meta-label">pontos</span>
      </div>

      <div className="onb-field">
        <input
          type="range"
          min={400}
          max={900}
          step={10}
          value={data.metaNota}
          onChange={(e) => onChange({ metaNota: Number(e.target.value) })}
          className="onb-range"
          style={
            {
              '--range-pct': `${((data.metaNota - 400) / 500) * 100}%`,
              '--range-color': notaColor,
            } as React.CSSProperties
          }
        />
        <div className="onb-range-labels">
          <span>400</span>
          <span>900</span>
        </div>
      </div>

      <div className="onb-meta-pills">
        {[500, 600, 700, 750, 800, 850].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ metaNota: n })}
            className={`onb-chip${data.metaNota === n ? ' onb-chip--active' : ''}`}
            style={
              data.metaNota === n
                ? { borderColor: getNotaColor(n), color: getNotaColor(n) }
                : undefined
            }
          >
            {n}
          </button>
        ))}
      </div>

      <div className="onb-ref-table">
        <p className="onb-ref-table__title">Notas de referencia</p>
        {NOTAS_REFERENCIA.map((r) => {
          const isHighlight =
            !!highlightCurso && r.curso.toLowerCase().includes(highlightCurso.toLowerCase())
          return (
            <div
              key={r.curso}
              className={`onb-ref-row${isHighlight ? ' onb-ref-row--highlight' : ''}`}
            >
              <span>{r.curso}</span>
              <span style={{ color: getNotaColor(r.nota), fontWeight: 600 }}>~{r.nota}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 3: Nivel por Area ─────────────────────────────── */

function StepNivel({
  data,
  onChange,
}: {
  data: OnboardingState
  onChange: (d: Partial<OnboardingState>) => void
}) {
  const setNivel = (area: string, nivel: NivelArea) => {
    onChange({ niveis: { ...data.niveis, [area]: nivel } })
  }

  return (
    <div className="onb-step-body">
      <StepHeader
        icon={<BarChart3 size={24} />}
        title="Como voce se avalia?"
        subtitle="Seja honesto — isso ajuda a criar sua rotina ideal"
      />

      {AREAS.map((area) => {
        const selected = data.niveis[area.key]
        const areaColor = `var(${area.cssVar})`
        return (
          <div
            key={area.key}
            className="onb-area-card"
            style={{ '--area-c': areaColor } as React.CSSProperties}
          >
            <div className="onb-area-card__accent" />
            <div className="onb-area-card__header">
              <div className="onb-area-card__icon">
                <area.Icon size={18} />
              </div>
              <span className="onb-area-card__label">{area.label}</span>
            </div>
            <div className="onb-nivel-row">
              {NIVEIS.map((n) => {
                const isSelected = selected === n.value
                return (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => setNivel(area.key, n.value)}
                    className={`onb-nivel-btn${isSelected ? ' onb-nivel-btn--active' : ''}`}
                  >
                    <span className="onb-nivel-dots">
                      {Array.from({ length: 3 }, (_, i) => (
                        <span
                          key={i}
                          className="onb-nivel-dot"
                          style={{
                            background:
                              i < n.dots
                                ? isSelected
                                  ? areaColor
                                  : 'var(--text-muted)'
                                : 'var(--bg-elevated)',
                          }}
                        />
                      ))}
                    </span>
                    <span style={isSelected ? { color: areaColor } : undefined}>{n.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Step 4: Disponibilidade ────────────────────────────── */

function StepDisponibilidade({
  data,
  onChange,
}: {
  data: OnboardingState
  onChange: (d: Partial<OnboardingState>) => void
}) {
  const toggleHorario = (h: Horario) => {
    const current = data.horarios
    onChange({
      horarios: current.includes(h) ? current.filter((x) => x !== h) : [...current, h],
    })
  }

  return (
    <div className="onb-step-body">
      <StepHeader
        icon={<Clock size={24} />}
        title="Quanto tempo voce tem?"
        subtitle="Vamos adaptar tudo ao seu ritmo"
      />

      <div className="onb-field">
        <label className="broto-label">Horas por dia</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {HORAS_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ horasPorDia: h })}
              className={`broto-hour-pill${data.horasPorDia === h ? ' broto-hour-pill--active' : ''}`}
            >
              {h}h
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ horasPorDia: 6 })}
            className={`broto-hour-pill${data.horasPorDia >= 6 ? ' broto-hour-pill--active' : ''}`}
          >
            6h+
          </button>
        </div>
      </div>

      <div className="onb-field">
        <label className="broto-label">Melhor horario pra estudar</label>
        <p className="onb-hint">Pode selecionar mais de um</p>
        <div className="onb-horarios">
          {HORARIOS.map((h) => {
            const selected = data.horarios.includes(h.value)
            return (
              <button
                key={h.value}
                type="button"
                onClick={() => toggleHorario(h.value)}
                className={`onb-horario${selected ? ' onb-horario--active' : ''}`}
              >
                {selected && (
                  <span className="onb-horario__check">
                    <Check size={12} />
                  </span>
                )}
                <span className="onb-horario__icon">
                  <h.Icon size={22} />
                </span>
                <span>{h.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Step 5: Resumo ─────────────────────────────────────── */

function NivelIndicator({ nivel, color }: { nivel: NivelArea | null; color: string }) {
  const dots = nivel === 'avancado' ? 3 : nivel === 'intermediario' ? 2 : 1
  return (
    <span className="onb-nivel-indicator">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="onb-nivel-indicator__dot"
          style={{ background: i <= dots ? color : 'var(--bg-elevated)' }}
        />
      ))}
    </span>
  )
}

function StepResumo({
  data,
  onSimulado,
  onStart,
  simuladoLoading,
  simuladoError,
  saveLoading,
  saveError,
}: {
  data: OnboardingState
  onSimulado: () => void | Promise<void>
  onStart: () => void | Promise<void>
  simuladoLoading: boolean
  simuladoError: string | null
  saveLoading: boolean
  saveError: string | null
}) {
  const nivelLabel = (n: NivelArea | null) =>
    n === 'avancado' ? 'Ava' : n === 'intermediario' ? 'Int' : 'Ini'

  return (
    <div className="onb-step-body">
      <StepHeader icon={<Sparkles size={24} />} title="Tudo pronto!" subtitle="Veja seu resumo" />

      <div className="onb-resumo-card">
        {(data.curso || data.faculdade) && (
          <div className="onb-resumo-row">
            <GraduationCap size={16} />
            <span>
              {data.curso || 'Curso nao definido'}
              {data.faculdade ? ` — ${data.faculdade}` : ''}
            </span>
          </div>
        )}
        <div className="onb-resumo-row">
          <Target size={16} />
          <span>Meta: {data.metaNota} pontos</span>
        </div>
        <div className="onb-resumo-row">
          <Clock size={16} />
          <span>
            {data.horasPorDia}h/dia
            {data.horarios.length > 0
              ? ` — ${data.horarios.map((h) => h.charAt(0).toUpperCase() + h.slice(1)).join(', ')}`
              : ''}
          </span>
        </div>
      </div>

      <div className="onb-resumo-areas">
        {AREAS.map((area) => (
          <div key={area.key} className="onb-resumo-area">
            <div className="onb-resumo-area__icon" style={{ color: `var(${area.cssVar})` }}>
              <area.Icon size={16} />
            </div>
            <NivelIndicator nivel={data.niveis[area.key]} color={`var(${area.cssVar})`} />
            <span className="onb-resumo-area__label">{nivelLabel(data.niveis[area.key])}</span>
          </div>
        ))}
      </div>

      <hr className="onb-divider" />

      <div className="onb-simulado-card">
        <div className="onb-simulado-card__header">
          <Brain size={24} />
          <span>Simulado diagnostico</span>
        </div>
        <p className="onb-simulado-card__desc">
          5 questoes de cada area (~15 min). Com isso, seu plano fica ainda mais preciso!
        </p>
        {simuladoError ? (
          <p className="onb-hint" style={{ color: 'var(--red-400)', marginBottom: 8 }}>
            {simuladoError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void onSimulado()}
          className="broto-btn-primary"
          disabled={simuladoLoading || saveLoading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {simuladoLoading ? (
            <Loader2 size={16} style={{ animation: 'broto-rotate 0.7s linear infinite' }} />
          ) : (
            <Brain size={16} />
          )}
          Fazer simulado
        </button>
      </div>

      {saveError ? (
        <p className="onb-hint" style={{ color: 'var(--red-400)', marginTop: 8 }}>
          {saveError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void onStart()}
        className="onb-btn-secondary"
        disabled={saveLoading || simuladoLoading}
      >
        {saveLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={16} style={{ animation: 'broto-rotate 0.7s linear infinite' }} />
            Salvando...
          </span>
        ) : (
          'Comecar sem simulado'
        )}
      </button>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────── */

export function Onboarding() {
  const { user } = useAuth()
  const { organization } = useClass()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [simuladoLoading, setSimuladoLoading] = useState(false)
  const [simuladoError, setSimuladoError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingState>({
    faculdade: '',
    curso: '',
    metaNota: 700,
    niveis: {
      linguagens: null,
      humanas: null,
      natureza: null,
      matematica: null,
    },
    horasPorDia: 2,
    horarios: [],
  })

  const updateData = useCallback(
    (partial: Partial<OnboardingState>) => setData((prev) => ({ ...prev, ...partial })),
    [],
  )

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleFinish = useCallback(async () => {
    setSaveError(null)
    setSaveLoading(true)
    try {
      await api.post('/api/user/onboarding', {
        faculdade: data.faculdade,
        curso: data.curso,
        metaNota: data.metaNota,
        niveis: data.niveis,
        horasPorDia: data.horasPorDia,
        horarios: data.horarios,
      })
      await refreshUser()
      navigate('/')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaveLoading(false)
    }
  }, [data, navigate])

  const handleSimulado = useCallback(async () => {
    setSimuladoError(null)
    const baseUrl = getQuestionsStaticBaseUrl(organization?.slug ?? null)
    if (!baseUrl) {
      setSimuladoError('Nao foi possivel carregar o banco de questoes.')
      return
    }

    const cfg = ONBOARDING_DIAGNOSTIC_MOCK_CFG
    setSimuladoLoading(true)
    try {
      await api.post('/api/user/onboarding', {
        faculdade: data.faculdade,
        curso: data.curso,
        metaNota: data.metaNota,
        niveis: data.niveis,
        horasPorDia: data.horasPorDia,
        horarios: data.horarios,
      })
      await refreshUser()

      const pool = await loadMockExamPool({
        baseUrl,
        randomMode: cfg.randomMode,
        areaValues: cfg.areaValues,
        topicoValues: cfg.topicoValues,
        years: cfg.years,
        language: cfg.language,
        expandLinguagensIdiomas: cfg.expandLinguagensIdiomas,
      })

      const built = buildMockExamPayload(
        cfg.nQuestoes,
        cfg.randomMode,
        cfg.areaValues,
        pool,
      )

      if (!built.ok) {
        if (built.error.code === 'POOL_EMPTY') {
          setSimuladoError(
            'Nenhuma questao encontrada. Tente novamente em instantes ou use a area de estudo.',
          )
        } else {
          setSimuladoError(
            `Nao ha questoes suficientes: pedidas ${built.error.requested}, disponiveis ${built.error.poolSize}.`,
          )
        }
        return
      }

      const questions = await fetchMockExamQuestions(baseUrl, built.questionIds)
      if (questions.length === 0) {
        setSimuladoError('Nao foi possivel carregar o conteudo das questoes. Tente novamente.')
        return
      }
      if (questions.length < built.questionIds.length) {
        setSimuladoError('Algumas questoes nao puderam ser carregadas. Tente de novo.')
        return
      }

      type CreateRes = { sessionId?: string; questionIds?: string[] }
      const created = await api.post<CreateRes>('/api/practice-session/create', {
        config: cfg,
        questionIds: built.questionIds,
      })

      if (!created.sessionId) {
        setSimuladoError('Erro ao criar sessao no servidor.')
        return
      }

      navigate(`/study/mock-exam/play/${created.sessionId}`, {
        state: {
          questions,
          sessionId: created.sessionId,
          questionIds: built.questionIds,
        },
      })
    } catch (e) {
      setSimuladoError(formatMockExamFlowError(e))
    } finally {
      setSimuladoLoading(false)
    }
  }, [navigate, organization?.slug, data])

  const handleSkipAll = useCallback(async () => {
    try {
      await api.post('/api/user/onboarding', {
        faculdade: '',
        curso: '',
        metaNota: 0,
        niveis: {},
        horasPorDia: 2,
        horarios: [],
      })
      await refreshUser()
    } catch {
      // ainda navega — usuario pode editar perfil depois
    }
    navigate('/')
  }, [navigate])

  const nome = user?.nome?.split(' ')[0] ?? ''

  return (
    <div className="broto-auth">
      <div className="onb-wizard">
        {/* Progress bar (not on welcome) */}
        {step > 0 && (
          <div className="onb-topbar">
            <button onClick={goBack} className="onb-nav-btn" aria-label="Voltar">
              <ChevronLeft size={20} />
            </button>
            <ProgressBar current={step} total={TOTAL_STEPS} />
            {step < TOTAL_STEPS ? (
              <button onClick={goNext} className="onb-skip-btn">
                Pular
              </button>
            ) : (
              <div style={{ width: 48 }} />
            )}
          </div>
        )}

        {/* Steps */}
        <div className="onb-step-container">
          {step === 0 && <StepWelcome nome={nome} onContinue={goNext} onSkipAll={handleSkipAll} />}
          {step === 1 && <StepObjetivo data={data} onChange={updateData} />}
          {step === 2 && <StepMeta data={data} onChange={updateData} />}
          {step === 3 && <StepNivel data={data} onChange={updateData} />}
          {step === 4 && <StepDisponibilidade data={data} onChange={updateData} />}
          {step === 5 && (
            <StepResumo
              data={data}
              onSimulado={handleSimulado}
              onStart={handleFinish}
              simuladoLoading={simuladoLoading}
              simuladoError={simuladoError}
              saveLoading={saveLoading}
              saveError={saveError}
            />
          )}
        </div>

        {/* Bottom CTA for steps 1-4 */}
        {step >= 1 && step <= 4 && (
          <div className="onb-bottom-cta">
            <button onClick={goNext} className="broto-btn-primary">
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
