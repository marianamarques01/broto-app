import { BKT_DEFAULT_P_KNOW } from '../ai/student-model/bkt.ts'
import {
  computeClassAreaStats,
  computeClassAtRisk,
  type TopicPerformanceInsightRow,
} from '../teacher/class-p-know-insights.ts'
import {
  DEFAULT_INACTIVE_DAYS,
  DEFAULT_WEAK_TOPIC_MIN_STUDENTS,
  DEFAULT_WEAK_TOPIC_P_KNOW_THRESHOLD,
} from './constants.ts'
import { buildActiveStudentSets, computeStudentEngagementState } from './student-engagement-state.ts'
import { computeAbandonmentRiskIndex, pct } from './compute-org-engagement-index.ts'
import type {
  ClassEngagementSnapshot,
  ClassRankingEntry,
  OrgAtRiskAlert,
  OrgEngagementSnapshot,
  StudentEngagementRow,
  WeakTopicSummary,
} from '../types/engagement.ts'

export type ClassEngagementComputeInput = {
  classId: string
  organizationId: string
  className: string
  studentIds: readonly string[]
  studentNames: ReadonlyMap<string, string>
  studentStreaks: ReadonlyMap<string, number>
  activityTimestampsByUser: ReadonlyMap<string, readonly string[]>
  performance: readonly TopicPerformanceInsightRow[]
  computedAt?: string
  inactiveDays?: number
}

function computeWeakTopics(
  performance: readonly TopicPerformanceInsightRow[],
  studentIds: readonly string[],
  threshold: number,
  minStudents: number,
): WeakTopicSummary[] {
  const studentSet = new Set(studentIds)
  const byTopic = new Map<
    string,
    { areaKey: string | null; values: number[]; students: Set<string> }
  >()

  for (const row of performance) {
    if (!studentSet.has(row.user_id)) continue
    const key = row.topico_value
    const entry = byTopic.get(key) ?? {
      areaKey: row.area_key,
      values: [],
      students: new Set<string>(),
    }
    entry.values.push(row.p_know ?? BKT_DEFAULT_P_KNOW)
    entry.students.add(row.user_id)
    if (row.area_key) entry.areaKey = row.area_key
    byTopic.set(key, entry)
  }

  return [...byTopic.entries()]
    .map(([topicoValue, data]) => ({
      topicoValue,
      areaKey: data.areaKey,
      avgPKnow: data.values.reduce((s, v) => s + v, 0) / data.values.length,
      studentCount: data.students.size,
    }))
    .filter((t) => t.studentCount >= minStudents && t.avgPKnow < threshold)
    .sort((a, b) => a.avgPKnow - b.avgPKnow)
}

function latestActivityIso(
  activityTimestampsByUser: ReadonlyMap<string, readonly string[]>,
  userId: string,
): string | null {
  const timestamps = activityTimestampsByUser.get(userId) ?? []
  if (timestamps.length === 0) return null
  const sorted = [...timestamps].sort()
  return sorted[sorted.length - 1] ?? null
}

export function computeClassEngagementSnapshot(
  input: ClassEngagementComputeInput,
): ClassEngagementSnapshot {
  const {
    classId,
    organizationId,
    studentIds,
    studentNames,
    studentStreaks,
    activityTimestampsByUser,
    performance,
    computedAt = new Date().toISOString(),
    inactiveDays = DEFAULT_INACTIVE_DAYS,
  } = input

  const totalStudents = studentIds.length
  const { active7d, active14d } = buildActiveStudentSets({
    studentIds,
    activityTimestampsByUser,
    inactiveDays,
  })

  const students: StudentEngagementRow[] = studentIds.map((userId) => {
    const streak = studentStreaks.get(userId) ?? 0
    const activeInLast7d = active7d.has(userId)
    const activeInLast14d = active14d.has(userId)
    return {
      userId,
      nome: studentNames.get(userId) ?? 'Aluno',
      streak,
      engagementState: computeStudentEngagementState({
        streak,
        lastActivityAt: latestActivityIso(activityTimestampsByUser, userId),
        activeInLast7d,
        activeInLast14d,
      }),
      lastActivityAt: latestActivityIso(activityTimestampsByUser, userId),
    }
  })

  const missingCount = students.filter((s) => s.engagementState === 'missing').length
  const streakBrokenCount = students.filter((s) => s.engagementState === 'at_risk').length
  const active7dCount = active7d.size

  const areaStats = computeClassAreaStats(performance)
  const avgPKnowByArea = Object.fromEntries(
    areaStats.map((a) => [a.area, Math.round(a.avgPKnow * 1000) / 1000]),
  )

  const atRisk = computeClassAtRisk({
    studentIds,
    studentNames,
    studentStreaks,
    activeStudentIds: active7d,
    performance,
  })

  const atRiskStudentIds = [
    ...new Set([
      ...atRisk.inactive.map((s) => s.userId),
      ...atRisk.struggling.map((s) => s.userId),
      ...students.filter((s) => s.engagementState !== 'engaged').map((s) => s.userId),
    ]),
  ]

  const weakTopics = computeWeakTopics(
    performance,
    studentIds,
    DEFAULT_WEAK_TOPIC_P_KNOW_THRESHOLD,
    DEFAULT_WEAK_TOPIC_MIN_STUDENTS,
  )

  return {
    classId,
    organizationId,
    computedAt,
    totalStudents,
    active7dCount,
    active7dPct: pct(active7dCount, totalStudents),
    streakBrokenCount,
    missingCount,
    missingDaysThreshold: inactiveDays,
    avgPKnowByArea,
    weakTopics,
    atRiskStudentIds,
    students,
    areaStats,
    atRisk,
  }
}

export function computeOrgEngagementSnapshot(params: {
  organizationId: string
  classSnapshots: Array<ClassEngagementSnapshot & { className: string }>
  computedAt?: string
}): OrgEngagementSnapshot {
  const { organizationId, classSnapshots, computedAt = new Date().toISOString() } = params

  const totalClasses = classSnapshots.length
  const totalStudents = classSnapshots.reduce((s, c) => s + c.totalStudents, 0)
  const active7dCount = classSnapshots.reduce((s, c) => s + c.active7dCount, 0)
  const missingCount = classSnapshots.reduce((s, c) => s + c.missingCount, 0)
  const streakBrokenCount = classSnapshots.reduce((s, c) => s + c.streakBrokenCount, 0)

  const active7dPct = pct(active7dCount, totalStudents)
  const abandonmentRiskIndex = computeAbandonmentRiskIndex({
    active7dPct,
    missingPct: pct(missingCount, totalStudents),
    streakBrokenPct: pct(streakBrokenCount, totalStudents),
  })

  const classRankings: ClassRankingEntry[] = [...classSnapshots]
    .map((c) => ({
      classId: c.classId,
      className: c.className,
      active7dPct: c.active7dPct,
      totalStudents: c.totalStudents,
      missingCount: c.missingCount,
    }))
    .sort((a, b) => b.active7dPct - a.active7dPct)

  const atRiskAlerts: OrgAtRiskAlert[] = classSnapshots
    .flatMap((c) =>
      c.students
        .filter((s) => s.engagementState !== 'engaged')
        .map((s) => ({
          userId: s.userId,
          nome: s.nome,
          classId: c.classId,
          className: c.className,
          engagementState: s.engagementState,
          streak: s.streak,
          severity:
            s.engagementState === 'missing' ? 100 : s.engagementState === 'at_risk' ? 60 : 0,
        })),
    )
    .sort((a, b) => b.severity - a.severity)

  return {
    organizationId,
    computedAt,
    totalClasses,
    totalStudents,
    active7dPct,
    abandonmentRiskIndex,
    classRankings,
    atRiskAlerts,
  }
}

/** Serializa snapshot de turma para persistência Postgres (jsonb + arrays). */
export function serializeClassSnapshotRow(snapshot: ClassEngagementSnapshot) {
  return {
    class_id: snapshot.classId,
    organization_id: snapshot.organizationId,
    computed_at: snapshot.computedAt,
    total_students: snapshot.totalStudents,
    active_7d_count: snapshot.active7dCount,
    active_7d_pct: snapshot.active7dPct,
    streak_broken_count: snapshot.streakBrokenCount,
    missing_count: snapshot.missingCount,
    missing_days_threshold: snapshot.missingDaysThreshold,
    avg_p_know_by_area: snapshot.avgPKnowByArea,
    weak_topics: snapshot.weakTopics,
    at_risk_student_ids: snapshot.atRiskStudentIds,
    student_engagement: snapshot.students,
  }
}

export function serializeOrgSnapshotRow(snapshot: OrgEngagementSnapshot) {
  return {
    organization_id: snapshot.organizationId,
    computed_at: snapshot.computedAt,
    total_classes: snapshot.totalClasses,
    total_students: snapshot.totalStudents,
    active_7d_pct: snapshot.active7dPct,
    abandonment_risk_index: snapshot.abandonmentRiskIndex,
    class_rankings: snapshot.classRankings,
    at_risk_alerts: snapshot.atRiskAlerts,
  }
}

/** Desserializa linha DB → snapshot de organização (para API). */
export function parseOrgSnapshotFromRow(row: {
  organization_id: string
  computed_at: string
  total_classes: number
  total_students: number
  active_7d_pct: number
  abandonment_risk_index: number
  class_rankings: ClassRankingEntry[] | null
  at_risk_alerts: OrgAtRiskAlert[] | null
}): OrgEngagementSnapshot {
  return {
    organizationId: row.organization_id,
    computedAt: row.computed_at,
    totalClasses: row.total_classes,
    totalStudents: row.total_students,
    active7dPct: Number(row.active_7d_pct),
    abandonmentRiskIndex: Number(row.abandonment_risk_index),
    classRankings: row.class_rankings ?? [],
    atRiskAlerts: row.at_risk_alerts ?? [],
  }
}

/** Desserializa linha DB → snapshot de turma (para API). */
export function parseClassSnapshotFromRow(row: {
  class_id: string
  organization_id: string
  computed_at: string
  total_students: number
  active_7d_count: number
  active_7d_pct: number
  streak_broken_count: number
  missing_count: number
  missing_days_threshold: number
  avg_p_know_by_area: Record<string, number> | null
  weak_topics: WeakTopicSummary[] | null
  at_risk_student_ids: string[] | null
  student_engagement: StudentEngagementRow[] | null
}): ClassEngagementSnapshot {
  const students = row.student_engagement ?? []
  return {
    classId: row.class_id,
    organizationId: row.organization_id,
    computedAt: row.computed_at,
    totalStudents: row.total_students,
    active7dCount: row.active_7d_count,
    active7dPct: Number(row.active_7d_pct),
    streakBrokenCount: row.streak_broken_count,
    missingCount: row.missing_count,
    missingDaysThreshold: row.missing_days_threshold,
    avgPKnowByArea: row.avg_p_know_by_area ?? {},
    weakTopics: row.weak_topics ?? [],
    atRiskStudentIds: row.at_risk_student_ids ?? [],
    students,
    areaStats: [],
    atRisk: { inactive: [], struggling: [] },
  }
}
