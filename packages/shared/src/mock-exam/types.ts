import type { Question } from '../types/question'
import type { MockExamResultItem } from './student-model-result'

export type PracticeSessionKind = 'student_mock' | 'class_assignment'
export type MockExamAnswerFeedbackMode = 'immediate' | 'final'

/**
 * Critérios escolhidos pelo aluno (persistidos em `practice_sessions.config`).
 * Mantenha campos JSON-serializáveis para o mobile reutilizar o mesmo contrato.
 */
export interface StudentMockExamConfig {
  nQuestoes: number
  randomMode: boolean
  areaValues: string[]
  topicoValues: string[]
  /** Anos permitidos; vazio = `MOCK_EXAM_YEAR_MIN`…`MOCK_EXAM_YEAR_MAX`. */
  years: number[]
  /** Filtro `language` nas questões de línguas; vazio = sem filtro por língua. */
  language: string
  /**
   * Quando a área Linguagens está selecionada e o aluno escolhe o tópico “Idiomas”
   * sem idioma específico, o corpus inclui inglês e espanhol (como o web).
   */
  expandLinguagensIdiomas: boolean
  /**
   * Tempo máximo para concluir a sessão de prática (minutos). Omitido ou `null` = sem limite
   * (cronômetro só conta tempo decorrido).
   */
  timeLimitMinutes?: number | null
  /** Quando revelar correção: a cada resposta ou apenas no resultado final. */
  answerFeedbackMode?: MockExamAnswerFeedbackMode
}

export interface MockExamPoolEntry {
  questionId: string
  year: number
  index: number
  language: string | null
  discipline: string | null
}

export type MockExamBuildError =
  | { code: 'POOL_EMPTY' }
  | { code: 'POOL_TOO_SMALL'; poolSize: number; requested: number }

export interface PracticeTopicStat {
  corretas: number
  total: number
  percentual: number
}

export interface PracticeSessionAnswerReviewItem {
  questionId: string
  label: string
  selectedLetter?: string
  correctLetter?: string | null
  isCorrect: boolean
}

/** Snapshot gravado em `practice_sessions.summary` e exibido no pós-prova. */
export interface PracticeSessionSummary {
  percentualGeral: number
  totalQuestoes: number
  totalCorretas: number
  tempoMedioPorQuestaoSeg: number | null
  tempoTotalSeg: number | null
  porArea: Record<string, PracticeTopicStat>
  porTopico: Record<string, PracticeTopicStat>
  respostas?: PracticeSessionAnswerReviewItem[]
  /** Resultado por questão — usado para análise BKT no pós-simulado. */
  resultados?: MockExamResultItem[]
}

export interface MockExamAnswerResult {
  questionId: string
  isCorrect: boolean
  timeSpentSec?: number
  selectedLetter?: string
  correctLetter?: string | null
}

/** Persistido em `practice_sessions.progress` para retomar simulado em andamento. */
export interface PracticeSessionProgressState {
  currentIndex: number
  skippedQuestionIds: string[]
}

export type BuildMockExamPayloadResult =
  | { ok: true; questionIds: string[]; selected: MockExamPoolEntry[] }
  | { ok: false; error: MockExamBuildError }

/** Resposta uma questão completa para o player (mesmo contrato `Question`). */
export type MockExamQuestion = Question
