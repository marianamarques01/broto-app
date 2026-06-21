import { useState } from 'react'
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import type { StudyPackage } from '@/lib/study-area-mock'

export function PracticeQuestions({
  questions,
  onDone,
}: {
  questions: StudyPackage['practiceQuestions']
  onDone: (correct: number, total: number) => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const q = questions[currentIdx]
  const correct = q.alternatives.find((a) => a.isCorrect)?.letter ?? ''
  const isLast = currentIdx === questions.length - 1

  function handleSelect(letter: string) {
    if (answered) return
    setSelected(letter)
    setAnswered(true)
    setResults((prev) => [...prev, letter === correct])
  }

  function handleNext() {
    if (isLast) {
      const c = results.filter(Boolean).length
      onDone(c, results.length)
    } else {
      setSelected(null)
      setAnswered(false)
      setCurrentIdx((prev) => prev + 1)
    }
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
          Questao {currentIdx + 1} de {questions.length}
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
          {results.filter(Boolean).length}/{results.length} corretas
        </span>
      </div>

      <div
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          marginBottom: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}
        >
          {q.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.alternatives.map((alt) => {
          const isSelected = selected === alt.letter
          const isCorrectAlt = alt.isCorrect
          let bg = 'var(--bg-deep)'
          let borderColor = 'var(--border-default)'
          let textColor = 'var(--text-primary)'
          let icon: React.ReactNode = null

          if (answered) {
            if (isCorrectAlt) {
              bg = 'rgba(16, 185, 129, 0.1)'
              borderColor = 'var(--green-500)'
              textColor = 'var(--green-400)'
              icon = <CheckCircle2 size={18} color="var(--green-400)" />
            } else if (isSelected) {
              bg = 'var(--red-glow)'
              borderColor = 'var(--red-500)'
              textColor = 'var(--red-400)'
              icon = <XCircle size={18} color="var(--red-400)" />
            }
          } else if (isSelected) {
            bg = 'var(--green-glow)'
            borderColor = 'var(--green-500)'
          }

          return (
            <button
              key={alt.letter}
              type="button"
              onClick={() => handleSelect(alt.letter)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${borderColor}`,
                background: bg,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background:
                    answered && isCorrectAlt ? 'var(--green-500)' : 'rgba(16,185,129,0.1)',
                  color: answered && isCorrectAlt ? '#fff' : 'var(--green-400)',
                }}
              >
                {alt.letter}
              </div>
              <span style={{ flex: 1, fontSize: '0.88rem', color: textColor }}>{alt.text}</span>
              {icon}
            </button>
          )
        })}
      </div>

      {answered && (
        <div
          style={{
            marginTop: 14,
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            background: selected === correct ? 'rgba(16,185,129,0.06)' : 'rgba(224,82,82,0.06)',
            border: `1px solid ${selected === correct ? 'rgba(16,185,129,0.15)' : 'rgba(224,82,82,0.15)'}`,
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: selected === correct ? 'var(--green-400)' : 'var(--red-400)',
            }}
          >
            {selected === correct ? 'Correto!' : 'Resposta incorreta'}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {q.explanation}
          </p>
        </div>
      )}

      {answered && (
        <button
          type="button"
          onClick={handleNext}
          className="broto-btn-primary"
          style={{ marginTop: 16, justifyContent: 'center' }}
        >
          {isLast ? 'Ver resultado' : 'Proxima questao'} <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}
