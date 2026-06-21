import { useState, useRef, useCallback, useEffect } from 'react'
import type { Question } from '@broto/shared'
import { getQuestionId } from '@broto/shared'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import {
  fetchQuestionDetailForBank,
  getQuestionBankStaticBaseUrl,
  type QuestionBankRow,
} from '@/hooks/useQuestionBank'

export function GuidedBankPracticeQuestions({
  areaKey,
  rows,
  onDone,
}: {
  areaKey: string
  rows: QuestionBankRow[]
  onDone: (correct: number, total: number) => void
}) {
  const baseUrl = getQuestionBankStaticBaseUrl()
  const [idx, setIdx] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [loadingQ, setLoadingQ] = useState(true)
  const [stats, setStats] = useState({ correct: 0, answered: 0 })
  const correctRef = useRef(0)
  const fetchGen = useRef(0)

  const row = rows[idx]

  const [prevRows, setPrevRows] = useState(rows)
  if (prevRows !== rows) {
    setPrevRows(rows)
    setStats({ correct: 0, answered: 0 })
    setIdx(0)
  }

  useEffect(() => {
    correctRef.current = 0
  }, [rows])

  useEffect(() => {
    if (!baseUrl || !row) return

    async function load() {
      fetchGen.current += 1
      const gen = fetchGen.current
      setLoadingQ(true)
      setQuestion(null)

      const q = await fetchQuestionDetailForBank(baseUrl, row.year, row.index, row.language)
      if (gen !== fetchGen.current) return
      setQuestion(q)
      setLoadingQ(false)
    }

    void load()
  }, [baseUrl, row])

  const displayLoading = row ? loadingQ : false
  const displayQuestion = row ? question : null

  const goNext = useCallback(() => {
    if (idx >= rows.length - 1) {
      onDone(correctRef.current, rows.length)
    } else {
      setIdx((i) => i + 1)
    }
  }, [idx, rows.length, onDone])

  if (!baseUrl) {
    return (
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        Não foi possível carregar o banco de questões.
      </p>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Questão {idx + 1} de {rows.length}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--green-glow)',
            color: 'var(--green-400)',
          }}
        >
          {stats.correct}/{stats.answered} corretas
        </span>
      </div>
      {displayLoading ? (
        <div className="broto-skeleton" style={{ height: 220, borderRadius: 20 }} />
      ) : !displayQuestion ? (
        <div
          style={{
            padding: 20,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Não foi possível carregar esta questão.
          </p>
          <button type="button" className="broto-btn-primary" onClick={goNext}>
            {idx >= rows.length - 1 ? 'Continuar' : 'Pular questão'}
          </button>
        </div>
      ) : (
        <QuestionPlayer
          key={getQuestionId(displayQuestion)}
          question={displayQuestion}
          areaKey={areaKey}
          onNext={goNext}
          onAnswerRecorded={({ isCorrect }) => {
            if (isCorrect) correctRef.current += 1
            setStats((s) => ({
              correct: s.correct + (isCorrect ? 1 : 0),
              answered: s.answered + 1,
            }))
          }}
        />
      )}
    </div>
  )
}
