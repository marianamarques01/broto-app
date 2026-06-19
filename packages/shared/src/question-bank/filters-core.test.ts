import { describe, it, expect } from 'vitest'
import type { Area, Exam } from '../types/question'
import {
  buildTopicQuestionSet,
  collectQuestionRefs,
  deriveFilterFlags,
  enrichTopicosForArea,
  idiomasLanguagesForFetch,
  matchesLanguageFilter,
  matchesTopicFilter,
  questionRefKeys,
  resolveSelectedAreaAfterCatalogLoad,
  resolveYearsToSearch,
} from './filters-core'
import { IDIOMAS_TOPIC, IDIOMAS_TOPIC_ID, LINGUAGENS_AREA_VALUE } from './constants'

describe('buildTopicQuestionSet', () => {
  it('maps topico value to question keys', () => {
    const set = buildTopicQuestionSet(
      {
        '2020-1': 'algebra',
        '2020-2': 'geometria',
        '2021-3': 'algebra',
      },
      'algebra',
    )
    expect(set).toEqual(new Set(['2020-1', '2021-3']))
  })
})

describe('resolveYearsToSearch', () => {
  const exams: Exam[] = [
    { year: 2020, title: '2020' },
    { year: 2022, title: '2022' },
    { year: 2021, title: '2021' },
  ]

  it('returns all years descending when no filter', () => {
    expect(resolveYearsToSearch(exams)).toEqual([2022, 2021, 2020])
  })

  it('filters by year string', () => {
    expect(resolveYearsToSearch(exams, '2021')).toEqual([2021])
  })
})

describe('questionRefKeys and topic/language matchers', () => {
  it('builds full and alt keys', () => {
    expect(questionRefKeys(2020, 5, 'ingles')).toEqual({
      full: '2020-5-ingles',
      alt: '2020-5',
    })
    expect(questionRefKeys(2020, 5, null)).toEqual({ full: '2020-5', alt: '2020-5' })
  })

  it('matches topic set by full or alt key', () => {
    const set = new Set(['2020-5-ingles'])
    expect(matchesTopicFilter(set, 2020, 5, 'ingles')).toBe(true)
    expect(matchesTopicFilter(set, 2020, 5, null)).toBe(false)
    expect(matchesTopicFilter(null, 2020, 5, null)).toBe(true)
  })

  it('matches language filter', () => {
    expect(matchesLanguageFilter('ingles', 'ingles')).toBe(true)
    expect(matchesLanguageFilter(null, 'ingles')).toBe(true)
    expect(matchesLanguageFilter('espanhol', 'ingles')).toBe(false)
    expect(matchesLanguageFilter(null, '')).toBe(true)
  })
})

describe('collectQuestionRefs', () => {
  const examDetailsByYear = [
    {
      year: 2022,
      details: {
        year: 2022,
        questions: [
          { title: 'Q1', index: 1, discipline: 'matematica', language: null },
          { title: 'Q2', index: 2, discipline: 'linguagens', language: 'ingles' },
          { title: 'Q3', index: 3, discipline: 'matematica', language: null },
        ],
      },
    },
  ]

  it('filters by area and topic set', () => {
    const topicSet = new Set(['2022-1'])
    const refs = collectQuestionRefs({
      examDetailsByYear,
      area: 'matematica',
      topicQuestionSet: topicSet,
    })
    expect(refs).toEqual([{ year: 2022, index: 1, language: null }])
  })

  it('filters by language when provided', () => {
    const refs = collectQuestionRefs({
      examDetailsByYear,
      area: 'linguagens',
      language: 'ingles',
    })
    expect(refs).toEqual([{ year: 2022, index: 2, language: 'ingles' }])
  })
})

describe('enrichTopicosForArea', () => {
  it('prepends idiomas topic for linguagens', () => {
    const topicos = [{ id: '1', value: 'gramatica', label: 'Gramática' }]
    const out = enrichTopicosForArea(LINGUAGENS_AREA_VALUE, topicos)
    expect(out[0]).toEqual(IDIOMAS_TOPIC)
    expect(out[1]).toEqual(topicos[0])
  })

  it('returns topicos unchanged for other areas', () => {
    const topicos = [{ id: '1', value: 'algebra', label: 'Álgebra' }]
    expect(enrichTopicosForArea('matematica', topicos)).toEqual(topicos)
  })
})

describe('resolveSelectedAreaAfterCatalogLoad', () => {
  const areas: Area[] = [
    { id: '1', value: 'matematica', label: 'Matemática' },
    { id: '2', value: 'linguagens', label: 'Linguagens' },
  ]

  it('prefers preferredArea when valid', () => {
    expect(
      resolveSelectedAreaAfterCatalogLoad(areas, {
        preferredArea: 'linguagens',
        autoSelectFirstArea: true,
        currentSelectedArea: '',
      }),
    ).toBe('linguagens')
  })

  it('falls back to first area when autoSelectFirstArea', () => {
    expect(
      resolveSelectedAreaAfterCatalogLoad(areas, {
        autoSelectFirstArea: true,
        currentSelectedArea: '',
      }),
    ).toBe('matematica')
  })

  it('keeps current when autoSelectFirstArea is false', () => {
    expect(
      resolveSelectedAreaAfterCatalogLoad(areas, {
        autoSelectFirstArea: false,
        currentSelectedArea: 'linguagens',
      }),
    ).toBe('linguagens')
  })
})

describe('deriveFilterFlags', () => {
  it('enables language filter only for linguagens + idiomas topic', () => {
    expect(deriveFilterFlags('matematica', '')).toEqual({
      isLinguagensArea: false,
      isIdiomasTopicSelected: false,
      isLanguageFilterEnabled: false,
    })
    expect(deriveFilterFlags(LINGUAGENS_AREA_VALUE, IDIOMAS_TOPIC_ID)).toEqual({
      isLinguagensArea: true,
      isIdiomasTopicSelected: true,
      isLanguageFilterEnabled: true,
    })
  })
})

describe('idiomasLanguagesForFetch', () => {
  it('returns both languages when empty', () => {
    expect(idiomasLanguagesForFetch('')).toEqual(['ingles', 'espanhol'])
  })

  it('returns single language when selected', () => {
    expect(idiomasLanguagesForFetch('ingles')).toEqual(['ingles'])
  })
})
