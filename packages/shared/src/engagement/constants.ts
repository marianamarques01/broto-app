import type { StudentEngagementState } from '../types/engagement.ts'

/** Dias sem atividade para classificar aluno como sumido. */
export const DEFAULT_INACTIVE_DAYS = 7

/** Janela para streak quebrado mas ainda “em risco” (não sumido). */
export const DEFAULT_AT_RISK_WINDOW_DAYS = 14

/** p_know médio abaixo disto + massa na turma → tópico fraco em massa. */
export const DEFAULT_WEAK_TOPIC_P_KNOW_THRESHOLD = 0.4

/** Mínimo de alunos com dado no tópico para aparecer como fraco em massa. */
export const DEFAULT_WEAK_TOPIC_MIN_STUDENTS = 2

/** Rótulos PT-BR para estados de engajamento (UI + export PDF). */
export const ENGAGEMENT_STATE_LABELS: Record<StudentEngagementState, string> = {
  engaged: 'Engajado',
  at_risk: 'Em risco',
  missing: 'Sumido',
}
