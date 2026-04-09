import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { Question } from '@broto/shared'
import {
  getQuestionId,
  questionFieldMarkdownToHtml,
  questionFieldNeedsHtmlRendering,
} from '@broto/shared'
import { submitAnswer } from '@/lib/answer-question'
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

interface QuestionPlayerProps {
  question: Question
  areaKey: string
  onNext: () => void
  sessionId?: string
  onAnswerRecorded?: (payload: {
    questionId: string
    isCorrect: boolean
    timeSpentSec: number
  }) => void
}

const purifyQuestionHtml = (raw: string) =>
  DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'span',
      'img',
      'ul',
      'ol',
      'li',
      'table',
      'tr',
      'td',
      'th',
      'sup',
      'sub',
      'b',
      'i',
      'u',
      'h3',
      'h4',
      'div',
    ],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'style'],
  })

export function QuestionPlayer({
  question,
  areaKey,
  onNext,
  sessionId,
  onAnswerRecorded,
}: QuestionPlayerProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const questionStartMs = useRef<number>(Date.now())

  useEffect(() => {
    questionStartMs.current = Date.now()
    setSelected(null)
    setAnswered(false)
  }, [question])

  const correct = question.alternatives.find((a) => a.isCorrect)?.letter ?? null

  const contextHtmlRaw = useMemo(
    () => questionFieldMarkdownToHtml(question.context),
    [question.context],
  )
  const contextSafeHtml = useMemo(
    () => (contextHtmlRaw ? purifyQuestionHtml(contextHtmlRaw) : ''),
    [contextHtmlRaw],
  )

  const titleHtmlRaw = useMemo(
    () => questionFieldMarkdownToHtml(question.title),
    [question.title],
  )
  const titleAsHtml = titleHtmlRaw != null && questionFieldNeedsHtmlRendering(titleHtmlRaw)
  const titleSafeHtml = useMemo(
    () => (titleAsHtml && titleHtmlRaw ? purifyQuestionHtml(titleHtmlRaw) : ''),
    [titleAsHtml, titleHtmlRaw],
  )

  async function handleSelect(letter: string) {
    if (answered) return
    setSelected(letter)
    setAnswered(true)
    setSubmitting(true)

    const isCorrect = letter === correct
    const timeSpentSec = Math.max(0, Math.round((Date.now() - questionStartMs.current) / 1000))
    try {
      await submitAnswer({
        questionId: getQuestionId(question),
        isCorrect,
        areaKey,
        timeSpentSec,
        sessionId,
      })
      onAnswerRecorded?.({
        questionId: getQuestionId(question),
        isCorrect,
        timeSpentSec,
      })
    } catch {
      // fail silently
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    setSelected(null)
    setAnswered(false)
    onNext()
  }

  return (
    <div className="broto-card" style={{ padding: 26 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
          }}
        >
          ENEM {question.year} · Questão {question.index}
        </span>
        {question.language && (
          <span
            style={{
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(43, 164, 184, 0.12)',
              color: 'var(--area-linguagens)',
              border: '1px solid rgba(43, 164, 184, 0.2)',
              fontWeight: 600,
            }}
          >
            {question.language}
          </span>
        )}
      </div>

      {contextSafeHtml ? (
        <div
          style={{
            fontSize: '0.88rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            marginBottom: 18,
            padding: 18,
            background: 'var(--bg-deep)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
          dangerouslySetInnerHTML={{ __html: contextSafeHtml }}
        />
      ) : null}

      {titleAsHtml ? (
        <div
          style={{
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            marginBottom: 22,
            marginTop: 0,
          }}
          dangerouslySetInnerHTML={{ __html: titleSafeHtml }}
        />
      ) : (
        <p
          style={{
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            marginBottom: 22,
            marginTop: 0,
          }}
        >
          {question.title}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.alternatives.map((alt) => {
          let bg = 'var(--bg-deep)'
          let borderColor = 'var(--border-default)'
          let textColor = 'var(--text-primary)'
          let icon = null

          if (answered) {
            if (alt.letter === correct) {
              bg = 'rgba(16, 185, 129, 0.1)'
              borderColor = 'var(--green-500)'
              textColor = 'var(--green-400)'
              icon = <CheckCircle2 size={18} style={{ color: 'var(--green-500)', flexShrink: 0 }} />
            } else if (alt.letter === selected && alt.letter !== correct) {
              bg = 'rgba(224, 82, 82, 0.1)'
              borderColor = 'var(--red-500)'
              textColor = 'var(--red-400)'
              icon = <XCircle size={18} style={{ color: 'var(--red-500)', flexShrink: 0 }} />
            }
          } else if (alt.letter === selected) {
            bg = 'var(--green-glow)'
            borderColor = 'var(--green-500)'
          }

          return (
            <button
              key={alt.letter}
              onClick={() => handleSelect(alt.letter)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                border: `2px solid ${borderColor}`,
                borderRadius: 'var(--radius-sm)',
                background: bg,
                color: textColor,
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  minWidth: 24,
                  height: 24,
                  borderRadius: 6,
                  background:
                    answered && alt.letter === correct
                      ? 'var(--green-500)'
                      : answered && alt.letter === selected
                        ? 'var(--red-500)'
                        : 'rgba(16, 185, 129, 0.1)',
                  color:
                    answered && (alt.letter === correct || alt.letter === selected)
                      ? '#fff'
                      : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {alt.letter}
              </span>
              <span style={{ flex: 1 }}>{alt.text ?? ''}</span>
              {icon}
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="broto-btn-primary broto-btn-primary--inline"
            style={{ padding: '12px 22px', fontSize: '0.88rem', gap: 8 }}
          >
            Próxima
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
