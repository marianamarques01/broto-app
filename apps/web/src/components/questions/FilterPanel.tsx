import type { Topico, Exam } from '@broto/shared'
import { LANGUAGE_OPTIONS } from '@/hooks/useQuestionsFilters'

interface FilterPanelProps {
  topicos: Topico[]
  exams: Exam[]
  selectedYear: string
  selectedTopico: string
  selectedLanguage: string
  onSelectYear: (year: string) => void
  onSelectTopico: (topico: string) => void
  onSelectLanguage: (lang: string) => void
  isLinguagensArea: boolean
  isLanguageFilterEnabled: boolean
}

export function FilterPanel({
  topicos, exams,
  selectedYear, selectedTopico, selectedLanguage,
  onSelectYear, onSelectTopico, onSelectLanguage,
  isLanguageFilterEnabled,
}: FilterPanelProps) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        className="broto-select"
        value={selectedYear}
        onChange={e => onSelectYear(e.target.value)}
      >
        <option value="">Todos os anos</option>
        {exams.map(exam => (
          <option key={exam.year} value={String(exam.year)}>{exam.year}</option>
        ))}
      </select>

      {topicos.length > 0 && (
        <select
          className="broto-select"
          value={selectedTopico}
          onChange={e => onSelectTopico(e.target.value)}
        >
          <option value="">Todos os tópicos</option>
          {topicos.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      )}

      {isLanguageFilterEnabled && (
        <select
          className="broto-select"
          value={selectedLanguage}
          onChange={e => onSelectLanguage(e.target.value)}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
