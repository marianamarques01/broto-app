import { BKT_DEFAULT_P_KNOW } from '../ai/student-model/bkt.ts'
import { isDisplayableEnemAreaKey } from '../enem-area-display.ts'
import type { EnemAreaKey } from '../enem-area-key.ts'

export const ENEM_AREA_LABELS: Record<EnemAreaKey, string> = {
  linguagens: 'Linguagens',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  matematica: 'Matemática',
}

export type TopicPerformanceInsightRow = {
  user_id: string
  area_key: string | null
  topico_value: string
  p_know: number | null
  last_practiced: string | null
}

export type ClassAreaStat = {
  area: string
  label: string
  avgPKnow: number
  studentCount: number
  lastUpdated: string | null
}

export type InactiveStudentSummary = {
  userId: string
  nome: string
  streak: number
}

export type StrugglingStudentSummary = {
  userId: string
  nome: string
  weakTopicCount: number
  lowestPKnow: number
}

export type ClassAtRiskData = {
  inactive: InactiveStudentSummary[]
  struggling: StrugglingStudentSummary[]
}

function groupByKey<T>(rows: readonly T[], key: keyof T): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const row of rows) {
    const k = String(row[key] ?? '')
    if (!k) continue
    const list = out[k] ?? []
    list.push(row)
    out[k] = list
  }
  return out
}

export function labelForEnemArea(areaKey: string): string {
  if (areaKey in ENEM_AREA_LABELS) {
    return ENEM_AREA_LABELS[areaKey as EnemAreaKey]
  }
  return areaKey
}

/** Domínio médio da turma por área ENEM (menor p_know primeiro). */
export function computeClassAreaStats(
  performance: readonly TopicPerformanceInsightRow[],
): ClassAreaStat[] {
  const withArea = performance.filter((r) => r.area_key && isDisplayableEnemAreaKey(r.area_key))

  return Object.entries(groupByKey(withArea, 'area_key'))
    .map(([area, records]) => ({
      area,
      label: labelForEnemArea(area),
      avgPKnow:
        records.reduce((sum, r) => sum + (r.p_know ?? BKT_DEFAULT_P_KNOW), 0) / records.length,
      studentCount: new Set(records.map((r) => r.user_id)).size,
      lastUpdated: (() => {
        const dates = records
          .map((r) => r.last_practiced)
          .filter((v): v is string => Boolean(v))
          .sort()
        return dates.length > 0 ? dates[dates.length - 1]! : null
      })(),
    }))
    .sort((a, b) => a.avgPKnow - b.avgPKnow)
}

export function pKnowTone(pKnow: number): 'good' | 'mid' | 'low' {
  if (pKnow >= 0.7) return 'good'
  if (pKnow >= 0.4) return 'mid'
  return 'low'
}

/** Alunos sem respostas nos últimos N dias; domínio baixo em 3+ tópicos. */
export function computeClassAtRisk(params: {
  studentIds: readonly string[]
  studentNames: ReadonlyMap<string, string>
  studentStreaks: ReadonlyMap<string, number>
  activeStudentIds: ReadonlySet<string>
  performance: readonly TopicPerformanceInsightRow[]
  weakPKnowThreshold?: number
  minWeakTopics?: number
}): ClassAtRiskData {
  const {
    studentIds,
    studentNames,
    studentStreaks,
    activeStudentIds,
    performance,
    weakPKnowThreshold = 0.3,
    minWeakTopics = 3,
  } = params

  const inactive: InactiveStudentSummary[] = studentIds
    .filter((id) => !activeStudentIds.has(id))
    .map((userId) => ({
      userId,
      nome: studentNames.get(userId) ?? 'Aluno',
      streak: studentStreaks.get(userId) ?? 0,
    }))

  const strugglingByStudent = Object.entries(groupByKey(performance, 'user_id'))
    .map(([userId, topics]) => {
      const weak = topics.filter((t) => (t.p_know ?? BKT_DEFAULT_P_KNOW) < weakPKnowThreshold)
      if (weak.length < minWeakTopics) return null
      return {
        userId,
        nome: studentNames.get(userId) ?? 'Aluno',
        weakTopicCount: weak.length,
        lowestPKnow: Math.min(...weak.map((t) => t.p_know ?? BKT_DEFAULT_P_KNOW)),
      }
    })
    .filter((row): row is StrugglingStudentSummary => row !== null)
    .sort((a, b) => a.lowestPKnow - b.lowestPKnow)

  return { inactive, struggling: strugglingByStudent }
}
