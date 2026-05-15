import type { Question } from '../types/question'
import { getQuestionId } from '../types/question'
import type { MockExamAnswerResult, PracticeSessionSummary, PracticeTopicStat } from './types'

function pct(c: number, t: number): number {
  if (t <= 0) return 0
  return Math.round((c / t) * 10000) / 100
}

function bumpStat(
  bucket: Record<string, PracticeTopicStat>,
  key: string,
  isCorrect: boolean,
): void {
  if (!bucket[key]) {
    bucket[key] = { corretas: 0, total: 0, percentual: 0 }
  }
  const s = bucket[key]
  s.total += 1
  if (isCorrect) s.corretas += 1
  s.percentual = pct(s.corretas, s.total)
}

/**
 * Agrega resultado da sessão de prática para persistir em `practice_sessions.summary` e exibir na UI.
 */
export function buildPracticeSessionSummary(
  results: MockExamAnswerResult[],
  questions: Question[],
  topicByQuestionId: Record<string, string | undefined>,
): PracticeSessionSummary {
  const qById = new Map<string, Question>()
  for (const q of questions) {
    qById.set(getQuestionId(q), q)
  }

  const porArea: Record<string, PracticeTopicStat> = {}
  const porTopico: Record<string, PracticeTopicStat> = {}

  let totalCorretas = 0
  const times: number[] = []

  for (const r of results) {
    const q = qById.get(r.questionId)
    const areaKey = q?.discipline ?? 'sem_area'
    bumpStat(porArea, areaKey, r.isCorrect)

    const topico = topicByQuestionId[r.questionId]
    if (topico) {
      bumpStat(porTopico, topico, r.isCorrect)
    } else {
      bumpStat(porTopico, '_sem_mapeamento', r.isCorrect)
    }

    if (r.isCorrect) totalCorretas += 1
    if (typeof r.timeSpentSec === 'number' && Number.isFinite(r.timeSpentSec) && r.timeSpentSec >= 0) {
      times.push(r.timeSpentSec)
    }
  }

  const totalQuestoes = results.length
  const tempoTotalSeg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0)) : null
  const tempoMedioPorQuestaoSeg =
    times.length > 0 ? Math.round((tempoTotalSeg! / times.length) * 100) / 100 : null

  return {
    percentualGeral: pct(totalCorretas, totalQuestoes),
    totalQuestoes,
    totalCorretas,
    tempoMedioPorQuestaoSeg,
    tempoTotalSeg,
    porArea,
    porTopico,
  }
}
