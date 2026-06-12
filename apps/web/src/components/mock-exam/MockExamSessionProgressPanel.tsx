import { Check, Circle, X } from 'lucide-react'
import { useMemo } from 'react'

export type MockExamQuestionCellState = 'current' | 'correct' | 'wrong' | 'skipped' | 'empty'

interface MockExamSessionProgressPanelProps {
  totalQuestions: number
  currentIndex: number
  questionIdsOrdered: string[]
  answersByQuestionId: Record<string, { isCorrect: boolean } | undefined>
  skippedQuestionIds: Set<string>
  onSelectIndex: (index: number) => void
  allAnswered: boolean
  onFinalize: () => void
  finalizing?: boolean
  onDesistir: () => void
}

function cellState(
  index: number,
  qid: string,
  currentIndex: number,
  answers: Record<string, { isCorrect: boolean } | undefined>,
  skipped: Set<string>,
): MockExamQuestionCellState {
  if (index === currentIndex) return 'current'
  const a = answers[qid]
  if (a) return a.isCorrect ? 'correct' : 'wrong'
  if (skipped.has(qid)) return 'skipped'
  return 'empty'
}

export function MockExamSessionProgressPanel({
  totalQuestions,
  currentIndex,
  questionIdsOrdered,
  answersByQuestionId,
  skippedQuestionIds,
  onSelectIndex,
  allAnswered,
  onFinalize,
  finalizing = false,
  onDesistir,
}: MockExamSessionProgressPanelProps) {
  const counts = useMemo(() => {
    let correct = 0
    let wrong = 0
    let skippedPending = 0
    for (const qid of questionIdsOrdered) {
      const a = answersByQuestionId[qid]
      if (a) {
        if (a.isCorrect) correct += 1
        else wrong += 1
      } else if (skippedQuestionIds.has(qid)) {
        skippedPending += 1
      }
    }
    const unanswered = Math.max(0, totalQuestions - correct - wrong - skippedPending)
    return { correct, wrong, unanswered, skippedPending }
  }, [questionIdsOrdered, answersByQuestionId, skippedQuestionIds, totalQuestions])

  const submitted = counts.correct + counts.wrong
  const progressPct =
    totalQuestions > 0 ? Math.min(100, Math.round((submitted / totalQuestions) * 100)) : 0
  const currentN = Math.min(totalQuestions, currentIndex + 1)

  return (
    <aside className="broto-mock-exam-session-panel" aria-label="Progresso da sessão de prova">
      <div className="broto-mock-exam-session-panel__shell">
        <header className="broto-mock-exam-session-panel__header">
          <div className="broto-mock-exam-session-panel__intro">
            <h2 className="broto-mock-exam-session-panel__title">Acompanhamento</h2>
            <p className="broto-mock-exam-session-panel__subtitle">
              Toque no número para ir direto à questão.
            </p>
          </div>
          <div className="broto-mock-exam-session-panel__status-block">
            <p className="broto-mock-exam-session-panel__current">
              <span className="broto-mock-exam-session-panel__current-label">Questão</span>
              <span className="broto-mock-exam-session-panel__current-value">
                {currentN}
                <span className="broto-mock-exam-session-panel__current-of">/{totalQuestions}</span>
              </span>
            </p>
            <div className="broto-mock-exam-session-panel__progress">
              <div className="broto-mock-exam-session-panel__progress-meta">
                <span>Respostas registradas</span>
                <span className="broto-mock-exam-session-panel__progress-fraction">
                  {submitted} de {totalQuestions}
                </span>
              </div>
              <div
                className="broto-mock-exam-session-panel__progress-track"
                role="progressbar"
                aria-valuenow={submitted}
                aria-valuemin={0}
                aria-valuemax={totalQuestions}
                aria-label={`Respostas registradas: ${submitted} de ${totalQuestions}`}
              >
                <div
                  className="broto-mock-exam-session-panel__progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <p className="broto-mock-exam-session-panel__section-label" id="mock-exam-qgrid-label">
          Mapa das questões
        </p>
        <div
          className="broto-mock-exam-session-panel__grid-wrap"
          role="grid"
          aria-labelledby="mock-exam-qgrid-label"
        >
          <div className="broto-mock-exam-session-panel__grid">
            {questionIdsOrdered.map((qid, i) => {
              const n = i + 1
              const st = cellState(i, qid, currentIndex, answersByQuestionId, skippedQuestionIds)
              const label =
                st === 'correct'
                  ? `Questão ${n}, resposta correta`
                  : st === 'wrong'
                    ? `Questão ${n}, resposta incorreta`
                    : st === 'skipped'
                      ? `Questão ${n}, pulada`
                      : st === 'current'
                        ? `Questão ${n}, atual`
                        : `Questão ${n}, não respondida`

              return (
                <button
                  key={qid}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-current={st === 'current' ? 'true' : undefined}
                  className={`broto-mock-exam-qcell broto-mock-exam-qcell--${st}`}
                  onClick={() => onSelectIndex(i)}
                >
                  <span className="broto-mock-exam-qcell__num">{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="broto-mock-exam-session-panel__stats" aria-live="polite">
          <div
            className="broto-mock-exam-session-panel__stat broto-mock-exam-session-panel__stat--ok"
            aria-label={`${counts.correct} acertos`}
          >
            <Check
              className="broto-mock-exam-session-panel__stat-glyph"
              size={14}
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="broto-mock-exam-session-panel__stat-value">{counts.correct}</span>
          </div>
          <div
            className="broto-mock-exam-session-panel__stat broto-mock-exam-session-panel__stat--bad"
            aria-label={`${counts.wrong} erros`}
          >
            <X
              className="broto-mock-exam-session-panel__stat-glyph"
              size={14}
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="broto-mock-exam-session-panel__stat-value">{counts.wrong}</span>
          </div>
          <div
            className="broto-mock-exam-session-panel__stat broto-mock-exam-session-panel__stat--pending"
            aria-label={`${counts.unanswered + counts.skippedPending} em aberto`}
          >
            <Circle
              className="broto-mock-exam-session-panel__stat-glyph"
              size={14}
              strokeWidth={2}
              aria-hidden
            />
            <span className="broto-mock-exam-session-panel__stat-value">
              {counts.unanswered + counts.skippedPending}
            </span>
          </div>
        </div>

        <div className="broto-mock-exam-session-panel__actions">
          <button
            type="button"
            className="broto-mock-exam-session-panel__btn-desistir"
            onClick={onDesistir}
          >
            Desistir
          </button>
          <button
            type="button"
            className={
              'broto-mock-exam-session-panel__btn-finalizar' +
              (allAnswered ? ' broto-mock-exam-session-panel__btn-finalizar--ready' : '')
            }
            disabled={!allAnswered || finalizing}
            onClick={onFinalize}
          >
            Finalizar
          </button>
        </div>
      </div>
    </aside>
  )
}
