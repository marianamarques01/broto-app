import { resolveBetaFeedbackFormUrl } from '@/components/home/HomeBetaSurveyModal'
import {
  INTEGRATED_TOUR_SLIDES,
  writeIntegratedTourPersist,
  type IntegratedTourStatus,
} from '@/lib/integrated-tour'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

const SLIDE_COUNT = INTEGRATED_TOUR_SLIDES.length

interface HomeIntegratedTourModalProps {
  open: boolean
  initialStep: number
  onRequestClose: () => void
}

function clampStep(step: number): number {
  const max = Math.max(0, SLIDE_COUNT - 1)
  if (Number.isNaN(step)) return 0
  return Math.min(max, Math.max(0, step))
}

function tourBodyWithEmphasis(body: string, terms?: string[]): ReactNode {
  if (!terms?.length) return body
  const pattern = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  if (!pattern) return body
  const re = new RegExp(`(${pattern})`, 'gi')
  const parts = body.split(re)
  const lowerTerms = new Set(terms.map((t) => t.toLowerCase()))
  return parts.map((part, i) => {
    if (lowerTerms.has(part.toLowerCase())) {
      return (
        <strong key={i} className="broto-integrated-tour__body-strong">
          {part}
        </strong>
      )
    }
    return part
  })
}

function HomeIntegratedTourModalInner({
  initialStep,
  onRequestClose,
}: {
  initialStep: number
  onRequestClose: () => void
}) {
  const [step, setStep] = useState(() => clampStep(initialStep))
  const panelRef = useRef<HTMLDivElement>(null)

  const persistProgress = useCallback((nextStep: number) => {
    writeIntegratedTourPersist({
      status: 'in_progress',
      step: clampStep(nextStep),
    })
  }, [])

  useEffect(() => {
    persistProgress(step)
  }, [step, persistProgress])

  const finish = useCallback(
    (status: Exclude<IntegratedTourStatus, 'in_progress'>) => {
      writeIntegratedTourPersist({
        status,
        step: status === 'skipped' ? 0 : SLIDE_COUNT - 1,
      })
      onRequestClose()
    },
    [onRequestClose],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish('skipped')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  useEffect(() => {
    const t = window.setTimeout(() => panelRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [step])

  const slide = INTEGRATED_TOUR_SLIDES[step]
  const isLast = step >= SLIDE_COUNT - 1
  const isNoteLayout = slide.layout === 'note'
  const hasHighlights = Boolean(slide.highlights?.length)
  const bodyContent = tourBodyWithEmphasis(slide.body, slide.bodyEmphasis)

  return (
    <div
      className="broto-integrated-tour-backdrop"
      role="presentation"
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        className={`broto-integrated-tour${isNoteLayout ? ' broto-integrated-tour--note-slide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="broto-integrated-tour-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' && step > 0) {
            e.preventDefault()
            setStep((s) => s - 1)
          }
          if (e.key === 'ArrowRight' && !isLast) {
            e.preventDefault()
            setStep((s) => s + 1)
          }
        }}
      >
        <header className="broto-integrated-tour__top">
          <button
            type="button"
            className="broto-integrated-tour__skip"
            onClick={() => finish('skipped')}
          >
            Pular tour
          </button>
        </header>

        <div className="broto-integrated-tour__carousel" aria-live="polite">
          <p className="broto-integrated-tour__step-line">
            Passo {step + 1} de {SLIDE_COUNT}
          </p>

          {isNoteLayout ? (
            <div className="broto-integrated-tour__note">
              <div className="broto-integrated-tour__note-panel">
                <h2 id="broto-integrated-tour-title" className="broto-integrated-tour__note-panel-title">
                  {slide.title}
                </h2>
                <p className="broto-integrated-tour__note-panel-body">{bodyContent}</p>
                <p className="broto-integrated-tour__note-panel-foot">
                  Obrigado por experimentar — qualquer feedback nos ajuda a evoluir. ❤️
                </p>

                <div className="broto-integrated-tour__note-survey">
                  <a
                    href={resolveBetaFeedbackFormUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="broto-btn-secondary broto-integrated-tour__note-survey-link"
                  >
                    Avaliar no formulário
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="broto-integrated-tour__intro">
                <h2 id="broto-integrated-tour-title" className="broto-integrated-tour__title">
                  {slide.title}
                </h2>

                <p className="broto-integrated-tour__body">{bodyContent}</p>
              </div>

              {hasHighlights ? (
                <div className="broto-integrated-tour__highlights-wrap">
                  <ul className="broto-integrated-tour__highlights">
                    {slide.highlights!.map((h, i) => {
                      const Hi = h.Icon
                      return (
                        <li key={i} className="broto-integrated-tour__highlight">
                          <span
                            className="broto-integrated-tour__highlight-icon"
                            style={{
                              color: `var(${h.accentVar})`,
                              background: `color-mix(in srgb, var(${h.accentVar}) 16%, var(--bg-elevated))`,
                              borderColor: `color-mix(in srgb, var(${h.accentVar}) 35%, var(--border-subtle))`,
                            }}
                          >
                            <Hi size={20} strokeWidth={2} aria-hidden />
                          </span>
                          <span className="broto-integrated-tour__highlight-copy">
                            <span className="broto-integrated-tour__highlight-label">{h.label}</span>
                            <span className="broto-integrated-tour__highlight-hint">{h.hint}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>

        <nav className="broto-integrated-tour__dots" aria-label="Slides do tour">
          {INTEGRATED_TOUR_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`broto-integrated-tour__dot${i === step ? ' broto-integrated-tour__dot--on' : ''}`}
              aria-label={`Ir para o passo ${i + 1}`}
              aria-current={i === step ? true : undefined}
              onClick={() => setStep(i)}
            />
          ))}
        </nav>

        <footer className="broto-integrated-tour__footer">
          <button
            type="button"
            className="broto-btn-secondary broto-btn-secondary--inline broto-integrated-tour__nav broto-integrated-tour__nav--ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft size={18} aria-hidden />
            Anterior
          </button>
          {isLast ? (
            <button
              type="button"
              className="broto-btn-primary broto-btn-primary--inline broto-integrated-tour__nav broto-integrated-tour__nav--primary"
              onClick={() => finish('completed')}
            >
              Começar
            </button>
          ) : (
            <button
              type="button"
              className="broto-btn-primary broto-btn-primary--inline broto-integrated-tour__nav broto-integrated-tour__nav--primary"
              onClick={() => setStep((s) => Math.min(SLIDE_COUNT - 1, s + 1))}
            >
              Próximo
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

export function HomeIntegratedTourModal({
  open,
  initialStep,
  onRequestClose,
}: HomeIntegratedTourModalProps) {
  if (!open) return null
  return (
    <HomeIntegratedTourModalInner
      key={initialStep}
      initialStep={initialStep}
      onRequestClose={onRequestClose}
    />
  )
}
