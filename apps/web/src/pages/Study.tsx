import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { AreaSelector } from '@/components/questions/AreaSelector'
import { FilterPanel } from '@/components/questions/FilterPanel'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import { useQuestionsFilters } from '@/hooks/useQuestionsFilters'

export function Study() {
  const {
    areas, topicos, exams, questions,
    loading, loadingQuestions, error,
    selectedArea, selectedYear, selectedTopico, selectedLanguage,
    setSelectedArea, setSelectedYear, setSelectedTopico, setSelectedLanguage,
    retry, isLinguagensArea, isLanguageFilterEnabled,
  } = useQuestionsFilters()

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentQuestion = questions[currentIndex] ?? null

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  function handleAreaChange(area: string) {
    setSelectedArea(area)
    setCurrentIndex(0)
  }

  return (
    <div>
      <TopBar title="Questões" />

      <div className="broto-main-inner">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="broto-skeleton" style={{ height: 44, width: '60%' }} />
            <div className="broto-skeleton" style={{ height: 44, width: '80%' }} />
          </div>
        ) : (
          <>
            <AreaSelector
              areas={areas}
              selectedArea={selectedArea}
              onSelectArea={handleAreaChange}
            />

            {selectedArea && (
              <div style={{ marginTop: 16 }}>
                <FilterPanel
                  topicos={topicos}
                  exams={exams}
                  selectedYear={selectedYear}
                  selectedTopico={selectedTopico}
                  selectedLanguage={selectedLanguage}
                  onSelectYear={setSelectedYear}
                  onSelectTopico={setSelectedTopico}
                  onSelectLanguage={setSelectedLanguage}
                  isLinguagensArea={isLinguagensArea}
                  isLanguageFilterEnabled={isLanguageFilterEnabled}
                />
              </div>
            )}

            {error && (
              <div className="broto-error-banner">
                <span>{error}</span>
                <button type="button" onClick={retry}>
                  Tentar novamente
                </button>
              </div>
            )}

            {loadingQuestions && (
              <div style={{ marginTop: 24 }}>
                <div className="broto-skeleton" style={{ height: 200 }} />
              </div>
            )}

            {!loadingQuestions && selectedArea && questions.length === 0 && !error && (
              <div className="broto-empty-state">
                <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{'\u{1F50D}'}</div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  Selecione filtros para começar
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Escolha ano, tópico ou idioma quando disponível.
                </p>
              </div>
            )}

            {!loadingQuestions && currentQuestion && (
              <div style={{ marginTop: 22 }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  marginBottom: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}>
                  Questão {currentIndex + 1} de {questions.length}
                </div>
                <QuestionPlayer
                  key={`${currentQuestion.year}-${currentQuestion.index}`}
                  question={currentQuestion}
                  areaKey={selectedArea}
                  onNext={handleNext}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
