import { type CSSProperties, type ReactNode } from 'react'
import { type StudyJourneyTab, STUDY_JOURNEY_STAGES } from '@broto/shared'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Map,
  RotateCcw,
  HelpCircle,
  Sprout,
} from 'lucide-react'

const TAB_ICONS = {
  summary: BookOpen,
  flashcards: RotateCcw,
  questions: HelpCircle,
  mindmap: Map,
} as const

export function StudySanctuaryHeader({
  topicLabel,
  areaLabel,
  focusMode,
  onToggleFocus,
  areaColor,
  belowLede,
}: {
  topicLabel: string
  areaLabel: string
  focusMode: boolean
  onToggleFocus: () => void
  areaColor: string
  /** Ex.: card “Questões do ENEM”. Oculto automaticamente em modo foco. */
  belowLede?: ReactNode
}) {
  return (
    <header className="study-sanctuary-header">
      <div className="study-sanctuary-header__eyebrow-row">
        <p className="study-sanctuary-header__eyebrow">Trilha do Broto · {areaLabel}</p>
        <button
          type="button"
          className={`study-focus-toggle${focusMode ? ' study-focus-toggle--on' : ''}`}
          onClick={onToggleFocus}
          style={{
            borderColor: `${areaColor}40`,
            color: focusMode ? areaColor : 'var(--text-secondary)',
          }}
        >
          {focusMode ? <EyeOff size={15} strokeWidth={1.9} /> : <Eye size={15} strokeWidth={1.9} />}
          {focusMode ? 'Sair do modo foco' : 'Modo foco'}
        </button>
      </div>
      <h1 className="study-sanctuary-header__title">{topicLabel}</h1>
      <p className="study-sanctuary-header__lede">
        {focusMode
          ? 'Modo foco: só o essencial. Respira e segue no seu ritmo.'
          : 'Uma jornada curta em quatro passos — constância emocional, não pressa.'}
      </p>
      {!focusMode && belowLede ? (
        <div className="study-sanctuary-header__below-lede">{belowLede}</div>
      ) : null}
    </header>
  )
}

export function HumanTrailProgress({
  completedCount,
  areaColor,
}: {
  completedCount: number
  areaColor: string
}) {
  const total = STUDY_JOURNEY_STAGES.length
  return (
    <div className="study-human-trail">
      <p className="study-human-trail__label">
        <Sprout size={14} strokeWidth={1.8} aria-hidden style={{ color: areaColor }} />
        Trilha: <strong>{completedCount}</strong> de {total} etapas
      </p>
      <div
        className="study-human-trail__segments"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        {STUDY_JOURNEY_STAGES.map((s, i) => (
          <div
            key={s.tab}
            className={`study-human-trail__seg${i < completedCount ? ' study-human-trail__seg--done' : ''}`}
            style={
              i < completedCount
                ? ({ background: areaColor, boxShadow: `0 0 14px ${areaColor}44` } as CSSProperties)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

export function GrowthTrail({
  activeTab,
  completed,
  onSelectTab,
  areaColor,
}: {
  activeTab: StudyJourneyTab
  completed: Record<StudyJourneyTab, boolean>
  onSelectTab: (t: StudyJourneyTab) => void
  areaColor: string
}) {
  return (
    <nav className="study-growth-trail" aria-label="Etapas da trilha">
      <p className="study-growth-trail__heading">Caminho</p>
      <ol className="study-growth-trail__list">
        {STUDY_JOURNEY_STAGES.map((stage) => {
          const Icon = TAB_ICONS[stage.tab]
          const isActive = activeTab === stage.tab
          const isDone = completed[stage.tab]
          return (
            <li key={stage.tab}>
              <button
                type="button"
                className={`study-growth-trail__step${isActive ? ' study-growth-trail__step--active' : ''}${isDone ? ' study-growth-trail__step--done' : ''}`}
                onClick={() => onSelectTab(stage.tab)}
                style={
                  isActive
                    ? ({
                        borderColor: `${areaColor}55`,
                        background: `${areaColor}10`,
                      } as CSSProperties)
                    : undefined
                }
              >
                <span
                  className="study-growth-trail__step-icon"
                  style={{ color: isActive ? areaColor : 'var(--text-muted)' }}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} strokeWidth={2} />
                  ) : (
                    <Icon size={16} strokeWidth={1.8} />
                  )}
                </span>
                <span className="study-growth-trail__step-body">
                  <span className="study-growth-trail__step-title">{stage.title}</span>
                  <span className="study-growth-trail__step-line">{stage.oneLiner}</span>
                </span>
                <ChevronRight size={14} className="study-growth-trail__chev" aria-hidden />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function StudyPackageLeaveDialog({
  open,
  completedCount,
  stageCount,
  onContinue,
  onSaveAndLeave,
  onDiscardAndLeave,
}: {
  open: boolean
  completedCount: number
  stageCount: number
  onContinue: () => void
  onSaveAndLeave: () => void
  onDiscardAndLeave: () => void
}) {
  if (!open) return null
  const pct = stageCount > 0 ? Math.min(100, Math.round((completedCount / stageCount) * 100)) : 0
  return (
    <div className="study-gentle-stop-backdrop" role="presentation" onClick={onContinue}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-pack-leave-title"
        className="study-gentle-stop-panel study-pack-leave"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="study-pack-leave-title" className="study-gentle-stop-title study-pack-leave__title">
          Sair do pacote?
        </h2>
        <p className="study-gentle-stop-body study-pack-leave__body">
          Você ainda não terminou esta trilha. Quer{' '}
          <strong>guardar o progresso neste aparelho</strong> para voltar depois no mesmo tópico?
        </p>

        <div className="study-pack-leave__progress" aria-label="Progresso na trilha">
          <div className="study-pack-leave__rail">
            <div className="study-pack-leave__rail-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="study-pack-leave__metrics">
            <span>Trilha do pacote</span>
            <span className="study-pack-leave__metrics-value">
              {completedCount} de {stageCount} etapas
            </span>
          </div>
        </div>

        <div className="study-pack-leave__actions">
          <button
            type="button"
            className="broto-btn-primary study-pack-leave__btn-primary"
            onClick={onSaveAndLeave}
          >
            Salvar e sair
          </button>
          <button
            type="button"
            className="broto-btn-secondary study-pack-leave__btn"
            onClick={onContinue}
          >
            Continuar estudando
          </button>
          {/* <button type="button" className="study-pack-leave__discard" onClick={onDiscardAndLeave}>
            Sair sem guardar
          </button> */}
        </div>
      </div>
    </div>
  )
}

export function StickyContextCta({
  title,
  sub,
  buttonText,
  onClick,
  disabled,
  areaColor,
}: {
  title: string
  sub?: string
  buttonText: string
  onClick: () => void
  disabled?: boolean
  areaColor: string
}) {
  return (
    <div className="study-sticky-cta" style={{ borderTopColor: `${areaColor}25` }}>
      <div className="study-sticky-cta__inner">
        <div className="study-sticky-cta__text">
          <span className="study-sticky-cta__label">{title}</span>
          {sub ? <span className="study-sticky-cta__sub">{sub}</span> : null}
        </div>
        <button
          type="button"
          className="broto-btn-primary study-sticky-cta__btn"
          disabled={disabled}
          onClick={onClick}
          style={{ background: areaColor, borderColor: areaColor }}
        >
          {buttonText}
          <ChevronRight size={17} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

export function StudyBackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="study-back-link study-package-journey__secondary"
    >
      <ArrowLeft size={14} strokeWidth={2} aria-hidden /> Voltar para a seleção
    </button>
  )
}

export function StudyPackageJourneyGrid({
  aside,
  main,
  focusMode,
}: {
  aside: ReactNode
  main: ReactNode
  focusMode: boolean
}) {
  return (
    <div className={`study-package-grid${focusMode ? ' study-package-grid--focus' : ''}`}>
      <aside className="study-package-grid__aside">{aside}</aside>
      <div className="study-package-grid__main">{main}</div>
    </div>
  )
}
